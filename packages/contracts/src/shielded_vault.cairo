use starknet::ContractAddress;

/// Shielded Vault Contract
/// 
/// Manages deposits, withdrawals, and balance note creation.
/// Tracks nullifiers to prevent double-spending.
/// 
/// Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7

#[starknet::interface]
trait IShieldedVault<TContractState> {
    /// Deposit assets and create a balance note commitment
    fn deposit(
        ref self: TContractState,
        asset: ContractAddress,
        amount: u256,
        note_commitment: felt252
    ) -> u256;

    /// Withdraw assets using a balance proof
    fn withdraw(
        ref self: TContractState,
        nullifier: felt252,
        recipient: ContractAddress,
        amount: u256,
        asset: ContractAddress,
        balance_proof: Span<felt252>,
        merkle_proof: Span<felt252>
    );

    /// Check if a nullifier has been spent
    fn is_nullifier_spent(self: @TContractState, nullifier: felt252) -> bool;

    /// Get the current commitment tree root
    fn get_commitment_tree_root(self: @TContractState) -> felt252;

    /// Check if an asset is supported
    fn is_asset_supported(self: @TContractState, asset: ContractAddress) -> bool;

    /// Add a supported asset (admin only)
    fn add_supported_asset(ref self: TContractState, asset: ContractAddress);

    /// Get total deposits for an asset
    fn get_total_deposits(self: @TContractState, asset: ContractAddress) -> u256;
}

#[starknet::contract]
mod ShieldedVault {
    use super::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess
    };

    #[storage]
    struct Storage {
        // Mapping of nullifiers to spent status
        nullifiers: Map<felt252, bool>,
        // Mapping of assets to supported status
        supported_assets: Map<ContractAddress, bool>,
        // Current Merkle tree root
        commitment_tree_root: felt252,
        // Total deposits per asset
        total_deposits: Map<ContractAddress, u256>,
        // Contract owner
        owner: ContractAddress,
        // Balance proof verifier contract address
        balance_proof_verifier: ContractAddress,
        // Next note index
        next_note_index: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Deposit: Deposit,
        Withdrawal: Withdrawal,
        AssetAdded: AssetAdded,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposit {
        #[key]
        commitment: felt252,
        note_index: u256,
        asset: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct Withdrawal {
        #[key]
        nullifier: felt252,
        recipient: ContractAddress,
        asset: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct AssetAdded {
        #[key]
        asset: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        balance_proof_verifier: ContractAddress,
        initial_root: felt252
    ) {
        self.owner.write(owner);
        self.balance_proof_verifier.write(balance_proof_verifier);
        self.commitment_tree_root.write(initial_root);
        self.next_note_index.write(0);
    }

    #[abi(embed_v0)]
    impl ShieldedVaultImpl of super::IShieldedVault<ContractState> {
        fn deposit(
            ref self: ContractState,
            asset: ContractAddress,
            amount: u256,
            note_commitment: felt252
        ) -> u256 {
            // Verify asset is supported
            assert(self.supported_assets.read(asset), 'Asset not supported');
            
            // Verify amount is positive
            assert(amount > 0, 'Amount must be positive');

            // Transfer assets from caller to contract
            // Note: In production, use IERC20 interface
            // IERC20Dispatcher { contract_address: asset }
            //     .transfer_from(get_caller_address(), get_contract_address(), amount);

            // Get current note index
            let note_index = self.next_note_index.read();

            // Update total deposits
            let current_total = self.total_deposits.read(asset);
            self.total_deposits.write(asset, current_total + amount);

            // Increment note index
            self.next_note_index.write(note_index + 1);

            // Emit deposit event
            self.emit(Deposit {
                commitment: note_commitment,
                note_index,
                asset,
                timestamp: starknet::get_block_timestamp(),
            });

            // Note: In production, update Merkle tree root
            // This would involve calling a tree management contract
            // or maintaining the tree on-chain

            note_index
        }

        fn withdraw(
            ref self: ContractState,
            nullifier: felt252,
            recipient: ContractAddress,
            amount: u256,
            asset: ContractAddress,
            balance_proof: Span<felt252>,
            merkle_proof: Span<felt252>
        ) {
            // Verify nullifier has not been spent
            assert(!self.nullifiers.read(nullifier), 'Nullifier already spent');

            // Verify balance proof
            // Note: In production, call balance proof verifier contract
            // let verifier = IBalanceProofVerifierDispatcher {
            //     contract_address: self.balance_proof_verifier.read()
            // };
            // assert(verifier.verify_proof(balance_proof, merkle_proof), 'Invalid proof');

            // Mark nullifier as spent
            self.nullifiers.write(nullifier, true);

            // Update total deposits
            let current_total = self.total_deposits.read(asset);
            assert(current_total >= amount, 'Insufficient vault balance');
            self.total_deposits.write(asset, current_total - amount);

            // Transfer assets to recipient
            // Note: In production, use IERC20 interface
            // IERC20Dispatcher { contract_address: asset }
            //     .transfer(recipient, amount);

            // Emit withdrawal event
            self.emit(Withdrawal {
                nullifier,
                recipient,
                asset,
                timestamp: starknet::get_block_timestamp(),
            });
        }

        fn is_nullifier_spent(self: @ContractState, nullifier: felt252) -> bool {
            self.nullifiers.read(nullifier)
        }

        fn get_commitment_tree_root(self: @ContractState) -> felt252 {
            self.commitment_tree_root.read()
        }

        fn is_asset_supported(self: @ContractState, asset: ContractAddress) -> bool {
            self.supported_assets.read(asset)
        }

        fn add_supported_asset(ref self: ContractState, asset: ContractAddress) {
            // Only owner can add assets
            assert(get_caller_address() == self.owner.read(), 'Only owner');

            self.supported_assets.write(asset, true);

            self.emit(AssetAdded { asset });
        }

        fn get_total_deposits(self: @ContractState, asset: ContractAddress) -> u256 {
            self.total_deposits.read(asset)
        }
    }

    // Internal functions
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn update_tree_root(ref self: ContractState, new_root: felt252) {
            self.commitment_tree_root.write(new_root);
        }
    }
}
