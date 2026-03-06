use starknet::ContractAddress;

/// Emergency Pause Mechanism
/// 
/// Implements emergency pause functionality for all contracts:
/// - Pausable operations
/// - Multi-sig pause control
/// - Time-locked unpause
/// - Emergency withdrawal
/// 
/// Requirements: 17.3, 17.5

#[starknet::interface]
trait IEmergencyPause<TContractState> {
    /// Pause all contract operations
    fn pause(ref self: TContractState);
    
    /// Unpause contract operations (time-locked)
    fn unpause(ref self: TContractState);
    
    /// Check if contract is paused
    fn is_paused(self: @TContractState) -> bool;
    
    /// Emergency withdrawal (only when paused)
    fn emergency_withdraw(
        ref self: TContractState,
        asset: ContractAddress,
        amount: u256,
        recipient: ContractAddress
    );
    
    /// Add pause guardian
    fn add_guardian(ref self: TContractState, guardian: ContractAddress);
    
    /// Remove pause guardian
    fn remove_guardian(ref self: TContractState, guardian: ContractAddress);
    
    /// Get pause status details
    fn get_pause_status(self: @TContractState) -> PauseStatus;
}

#[derive(Drop, Serde, starknet::Store)]
struct PauseStatus {
    paused: bool,
    pause_timestamp: u64,
    pause_reason: felt252,
    unpause_delay: u64,
    can_unpause_at: u64,
}

#[starknet::contract]
mod EmergencyPause {
    use super::{ContractAddress, PauseStatus};
    use starknet::{get_caller_address, get_block_timestamp};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess
    };

    #[storage]
    struct Storage {
        // Pause state
        paused: bool,
        pause_timestamp: u64,
        pause_reason: felt252,
        
        // Unpause time-lock (24 hours by default)
        unpause_delay: u64,
        can_unpause_at: u64,
        
        // Guardians (multi-sig)
        guardians: Map<ContractAddress, bool>,
        guardian_count: u32,
        required_guardians: u32,
        
        // Pause votes
        pause_votes: Map<ContractAddress, bool>,
        current_pause_votes: u32,
        
        // Contract owner
        owner: ContractAddress,
        
        // Emergency mode
        emergency_mode: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Paused: Paused,
        Unpaused: Unpaused,
        GuardianAdded: GuardianAdded,
        GuardianRemoved: GuardianRemoved,
        EmergencyWithdrawal: EmergencyWithdrawal,
        PauseVoteCast: PauseVoteCast,
    }

    #[derive(Drop, starknet::Event)]
    struct Paused {
        by: ContractAddress,
        reason: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct Unpaused {
        by: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct GuardianAdded {
        guardian: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct GuardianRemoved {
        guardian: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct EmergencyWithdrawal {
        asset: ContractAddress,
        amount: u256,
        recipient: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PauseVoteCast {
        guardian: ContractAddress,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        initial_guardians: Span<ContractAddress>,
        required_guardians: u32
    ) {
        self.owner.write(owner);
        self.paused.write(false);
        self.unpause_delay.write(86400); // 24 hours in seconds
        self.required_guardians.write(required_guardians);
        self.guardian_count.write(0);
        self.current_pause_votes.write(0);
        self.emergency_mode.write(false);

        // Add initial guardians
        let mut i = 0;
        loop {
            if i >= initial_guardians.len() {
                break;
            }
            
            let guardian = *initial_guardians.at(i);
            self.guardians.write(guardian, true);
            self.guardian_count.write(self.guardian_count.read() + 1);
            
            i += 1;
        };
    }

    #[abi(embed_v0)]
    impl EmergencyPauseImpl of super::IEmergencyPause<ContractState> {
        fn pause(ref self: ContractState) {
            let caller = get_caller_address();
            
            // Check if caller is guardian
            assert(self.guardians.read(caller), 'Not a guardian');
            
            // Check if already paused
            if self.paused.read() {
                return;
            }

            // Cast pause vote
            if !self.pause_votes.read(caller) {
                self.pause_votes.write(caller, true);
                self.current_pause_votes.write(self.current_pause_votes.read() + 1);
                
                self.emit(PauseVoteCast {
                    guardian: caller,
                    timestamp: get_block_timestamp(),
                });
            }

            // Check if enough votes
            if self.current_pause_votes.read() >= self.required_guardians.read() {
                // Pause the contract
                self.paused.write(true);
                self.pause_timestamp.write(get_block_timestamp());
                self.pause_reason.write('Multi-sig pause');
                
                // Set unpause time-lock
                let unpause_at = get_block_timestamp() + self.unpause_delay.read();
                self.can_unpause_at.write(unpause_at);

                self.emit(Paused {
                    by: caller,
                    reason: 'Multi-sig pause',
                    timestamp: get_block_timestamp(),
                });
            }
        }

        fn unpause(ref self: ContractState) {
            let caller = get_caller_address();
            
            // Only owner can unpause
            assert(caller == self.owner.read(), 'Only owner can unpause');
            
            // Check if paused
            assert(self.paused.read(), 'Not paused');
            
            // Check time-lock
            let now = get_block_timestamp();
            assert(now >= self.can_unpause_at.read(), 'Time-lock not expired');

            // Unpause
            self.paused.write(false);
            self.pause_timestamp.write(0);
            self.pause_reason.write(0);
            self.can_unpause_at.write(0);
            
            // Reset pause votes
            self.current_pause_votes.write(0);

            self.emit(Unpaused {
                by: caller,
                timestamp: now,
            });
        }

        fn is_paused(self: @ContractState) -> bool {
            self.paused.read()
        }

        fn emergency_withdraw(
            ref self: ContractState,
            asset: ContractAddress,
            amount: u256,
            recipient: ContractAddress
        ) {
            let caller = get_caller_address();
            
            // Only owner can emergency withdraw
            assert(caller == self.owner.read(), 'Only owner');
            
            // Must be paused
            assert(self.paused.read(), 'Not paused');
            
            // Note: In production, call asset contract to transfer
            // IERC20Dispatcher { contract_address: asset }
            //     .transfer(recipient, amount);

            self.emit(EmergencyWithdrawal {
                asset,
                amount,
                recipient,
                timestamp: get_block_timestamp(),
            });
        }

        fn add_guardian(ref self: ContractState, guardian: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner');
            
            assert(!self.guardians.read(guardian), 'Already guardian');
            
            self.guardians.write(guardian, true);
            self.guardian_count.write(self.guardian_count.read() + 1);

            self.emit(GuardianAdded {
                guardian,
                timestamp: get_block_timestamp(),
            });
        }

        fn remove_guardian(ref self: ContractState, guardian: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner');
            
            assert(self.guardians.read(guardian), 'Not a guardian');
            
            self.guardians.write(guardian, false);
            self.guardian_count.write(self.guardian_count.read() - 1);

            self.emit(GuardianRemoved {
                guardian,
                timestamp: get_block_timestamp(),
            });
        }

        fn get_pause_status(self: @ContractState) -> PauseStatus {
            PauseStatus {
                paused: self.paused.read(),
                pause_timestamp: self.pause_timestamp.read(),
                pause_reason: self.pause_reason.read(),
                unpause_delay: self.unpause_delay.read(),
                can_unpause_at: self.can_unpause_at.read(),
            }
        }
    }

    // Pausable modifier trait
    #[generate_trait]
    impl PausableModifier of PausableModifierTrait {
        fn require_not_paused(self: @ContractState) {
            assert(!self.paused.read(), 'Contract is paused');
        }

        fn require_paused(self: @ContractState) {
            assert(self.paused.read(), 'Contract is not paused');
        }
    }
}

/// Pausable trait for contracts to implement
#[starknet::interface]
trait IPausable<TContractState> {
    fn pause(ref self: TContractState);
    fn unpause(ref self: TContractState);
    fn is_paused(self: @TContractState) -> bool;
}
