use starknet::ContractAddress;

/// Audit Gateway Contract
/// 
/// Manages viewing keys for selective disclosure.
/// Allows users to grant auditors access to specific data.
/// 
/// Requirements: 6.1, 6.2, 6.6

#[derive(Drop, Serde, starknet::Store, Copy)]
struct ViewingKey {
    owner: ContractAddress,
    data_scope: felt252,
    expiration: u64,
    revoked: bool,
}

#[starknet::interface]
trait IAuditGateway<TContractState> {
    /// Register a new viewing key
    fn register_viewing_key(
        ref self: TContractState,
        key_id: felt252,
        data_scope: felt252,
        expiration: u64
    );

    /// Revoke a viewing key
    fn revoke_viewing_key(ref self: TContractState, key_id: felt252);

    /// Check if a viewing key is valid
    fn is_key_valid(self: @TContractState, key_id: felt252) -> bool;

    /// Get viewing key details
    fn get_viewing_key(self: @TContractState, key_id: felt252) -> ViewingKey;

    /// Get all viewing keys for a user
    fn get_user_keys(self: @TContractState, user: ContractAddress) -> Array<felt252>;
}

#[starknet::contract]
mod AuditGateway {
    use super::{ContractAddress, ViewingKey};
    use starknet::{get_caller_address, get_block_timestamp};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess,
        Vec, VecTrait, MutableVecTrait
    };

    #[storage]
    struct Storage {
        // Mapping of key ID to viewing key
        viewing_keys: Map<felt252, ViewingKey>,
        // Mapping of user to their key IDs
        user_keys: Map<ContractAddress, Vec<felt252>>,
        // Total keys registered
        total_keys: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ViewingKeyRegistered: ViewingKeyRegistered,
        ViewingKeyRevoked: ViewingKeyRevoked,
    }

    #[derive(Drop, starknet::Event)]
    struct ViewingKeyRegistered {
        #[key]
        key_id: felt252,
        owner: ContractAddress,
        data_scope: felt252,
        expiration: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct ViewingKeyRevoked {
        #[key]
        key_id: felt252,
        owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.total_keys.write(0);
    }

    #[abi(embed_v0)]
    impl AuditGatewayImpl of super::IAuditGateway<ContractState> {
        fn register_viewing_key(
            ref self: ContractState,
            key_id: felt252,
            data_scope: felt252,
            expiration: u64
        ) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();

            // Verify expiration is in the future
            assert(expiration > current_time, 'Invalid expiration');

            // Verify key doesn't already exist
            let existing_key = self.viewing_keys.read(key_id);
            assert(existing_key.owner.is_zero(), 'Key already exists');

            // Create viewing key
            let viewing_key = ViewingKey {
                owner: caller,
                data_scope,
                expiration,
                revoked: false,
            };

            // Store viewing key
            self.viewing_keys.write(key_id, viewing_key);

            // Add to user's keys
            self.user_keys.entry(caller).append().write(key_id);

            // Increment total keys
            let total = self.total_keys.read();
            self.total_keys.write(total + 1);

            // Emit event
            self.emit(ViewingKeyRegistered {
                key_id,
                owner: caller,
                data_scope,
                expiration,
            });
        }

        fn revoke_viewing_key(ref self: ContractState, key_id: felt252) {
            let caller = get_caller_address();
            let mut viewing_key = self.viewing_keys.read(key_id);

            // Verify key exists
            assert(!viewing_key.owner.is_zero(), 'Key does not exist');

            // Verify caller is owner
            assert(viewing_key.owner == caller, 'Not key owner');

            // Verify not already revoked
            assert(!viewing_key.revoked, 'Already revoked');

            // Mark as revoked
            viewing_key.revoked = true;
            self.viewing_keys.write(key_id, viewing_key);

            // Emit event
            self.emit(ViewingKeyRevoked {
                key_id,
                owner: caller,
            });
        }

        fn is_key_valid(self: @ContractState, key_id: felt252) -> bool {
            let viewing_key = self.viewing_keys.read(key_id);
            let current_time = get_block_timestamp();

            // Key is valid if:
            // 1. It exists (owner is not zero)
            // 2. Not revoked
            // 3. Not expired
            !viewing_key.owner.is_zero()
                && !viewing_key.revoked
                && viewing_key.expiration > current_time
        }

        fn get_viewing_key(self: @ContractState, key_id: felt252) -> ViewingKey {
            self.viewing_keys.read(key_id)
        }

        fn get_user_keys(self: @ContractState, user: ContractAddress) -> Array<felt252> {
            let mut keys = ArrayTrait::new();
            let user_keys_vec = self.user_keys.entry(user);
            let len = user_keys_vec.len();

            let mut i: u64 = 0;
            loop {
                if i >= len {
                    break;
                }

                let key_id = user_keys_vec.at(i).read();
                keys.append(key_id);

                i += 1;
            };

            keys
        }
    }

    // Internal functions
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn cleanup_expired_keys(ref self: ContractState, user: ContractAddress) {
            // Remove expired keys from user's list
            // This would be called periodically or during other operations
            let current_time = get_block_timestamp();
            let user_keys_vec = self.user_keys.entry(user);
            let len = user_keys_vec.len();

            let mut i: u64 = 0;
            loop {
                if i >= len {
                    break;
                }

                let key_id = user_keys_vec.at(i).read();
                let viewing_key = self.viewing_keys.read(key_id);

                if viewing_key.expiration <= current_time {
                    // Mark as expired (could remove from storage to save gas)
                    // In production, implement efficient removal
                }

                i += 1;
            };
        }
    }
}
