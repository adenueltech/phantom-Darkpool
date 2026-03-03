use starknet::ContractAddress;

/// Order Registry Contract
/// 
/// Stores order commitments and manages order lifecycle.
/// Tracks order status (active, cancelled, expired).
/// 
/// Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 11.4, 11.5

#[derive(Drop, Serde, starknet::Store)]
struct OrderMetadata {
    commitment_hash: felt252,
    timestamp: u64,
    expiration: u64,
    active: bool,
    cancelled: bool,
    owner: ContractAddress,
}

#[starknet::interface]
trait IOrderRegistry<TContractState> {
    /// Submit a new order with validity proof
    fn submit_order(
        ref self: TContractState,
        order_commitment: felt252,
        expiration: u64,
        order_validity_proof: Span<felt252>
    ) -> felt252;

    /// Cancel an order (owner only)
    fn cancel_order(
        ref self: TContractState,
        order_id: felt252,
        ownership_proof: Span<felt252>
    );

    /// Check if an order is active
    fn is_order_active(self: @TContractState, order_id: felt252) -> bool;

    /// Get order metadata
    fn get_order(self: @TContractState, order_id: felt252) -> OrderMetadata;

    /// Get all active order IDs
    fn get_active_orders(self: @TContractState) -> Array<felt252>;

    /// Mark order as expired (can be called by anyone)
    fn mark_expired(ref self: TContractState, order_id: felt252);
}

#[starknet::contract]
mod OrderRegistry {
    use super::{ContractAddress, OrderMetadata};
    use starknet::{get_caller_address, get_block_timestamp};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess,
        Vec, VecTrait, MutableVecTrait
    };

    #[storage]
    struct Storage {
        // Mapping of order ID to order metadata
        orders: Map<felt252, OrderMetadata>,
        // List of active order IDs
        active_order_ids: Vec<felt252>,
        // Order validity proof verifier contract
        order_verifier: ContractAddress,
        // Contract owner
        owner: ContractAddress,
        // Total orders submitted
        total_orders: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OrderSubmitted: OrderSubmitted,
        OrderCancelled: OrderCancelled,
        OrderExpired: OrderExpired,
    }

    #[derive(Drop, starknet::Event)]
    struct OrderSubmitted {
        #[key]
        order_id: felt252,
        commitment: felt252,
        expiration: u64,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct OrderCancelled {
        #[key]
        order_id: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct OrderExpired {
        #[key]
        order_id: felt252,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        order_verifier: ContractAddress
    ) {
        self.owner.write(owner);
        self.order_verifier.write(order_verifier);
        self.total_orders.write(0);
    }

    #[abi(embed_v0)]
    impl OrderRegistryImpl of super::IOrderRegistry<ContractState> {
        fn submit_order(
            ref self: ContractState,
            order_commitment: felt252,
            expiration: u64,
            order_validity_proof: Span<felt252>
        ) -> felt252 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();

            // Verify expiration is in the future
            assert(expiration > current_time, 'Order already expired');

            // Verify order validity proof
            // Note: In production, call order validity proof verifier
            // let verifier = IOrderValidityProofVerifierDispatcher {
            //     contract_address: self.order_verifier.read()
            // };
            // assert(verifier.verify_proof(order_validity_proof), 'Invalid proof');

            // Generate order ID (hash of commitment and timestamp)
            let order_id = order_commitment; // Simplified; in production use proper ID generation

            // Create order metadata
            let metadata = OrderMetadata {
                commitment_hash: order_commitment,
                timestamp: current_time,
                expiration,
                active: true,
                cancelled: false,
                owner: caller,
            };

            // Store order
            self.orders.write(order_id, metadata);

            // Add to active orders list
            self.active_order_ids.append().write(order_id);

            // Increment total orders
            let total = self.total_orders.read();
            self.total_orders.write(total + 1);

            // Emit event
            self.emit(OrderSubmitted {
                order_id,
                commitment: order_commitment,
                expiration,
                owner: caller,
            });

            order_id
        }

        fn cancel_order(
            ref self: ContractState,
            order_id: felt252,
            ownership_proof: Span<felt252>
        ) {
            let caller = get_caller_address();
            let mut order = self.orders.read(order_id);

            // Verify order exists and is active
            assert(order.active, 'Order not active');
            assert(!order.cancelled, 'Order already cancelled');

            // Verify ownership
            assert(order.owner == caller, 'Not order owner');

            // Note: In production, verify ownership proof
            // This would prove knowledge of the order details without revealing them

            // Mark as cancelled
            order.cancelled = true;
            order.active = false;
            self.orders.write(order_id, order);

            // Remove from active orders
            // Note: In production, implement efficient removal from Vec

            // Emit event
            self.emit(OrderCancelled { order_id });
        }

        fn is_order_active(self: @ContractState, order_id: felt252) -> bool {
            let order = self.orders.read(order_id);
            let current_time = get_block_timestamp();

            // Order is active if:
            // 1. Active flag is true
            // 2. Not cancelled
            // 3. Not expired
            order.active && !order.cancelled && order.expiration > current_time
        }

        fn get_order(self: @ContractState, order_id: felt252) -> OrderMetadata {
            self.orders.read(order_id)
        }

        fn get_active_orders(self: @ContractState) -> Array<felt252> {
            let mut active_orders = ArrayTrait::new();
            let current_time = get_block_timestamp();

            // Iterate through active order IDs
            let len = self.active_order_ids.len();
            let mut i: u64 = 0;
            loop {
                if i >= len {
                    break;
                }

                let order_id = self.active_order_ids.at(i).read();
                let order = self.orders.read(order_id);

                // Check if still active
                if order.active && !order.cancelled && order.expiration > current_time {
                    active_orders.append(order_id);
                }

                i += 1;
            };

            active_orders
        }

        fn mark_expired(ref self: ContractState, order_id: felt252) {
            let mut order = self.orders.read(order_id);
            let current_time = get_block_timestamp();

            // Verify order is expired
            assert(order.expiration <= current_time, 'Order not expired');
            assert(order.active, 'Order not active');

            // Mark as inactive
            order.active = false;
            self.orders.write(order_id, order);

            // Emit event
            self.emit(OrderExpired { order_id });
        }
    }

    // Internal functions
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn cleanup_expired_orders(ref self: ContractState) {
            // Periodically clean up expired orders from active list
            // This would be called by a keeper or during other operations
            let current_time = get_block_timestamp();
            let len = self.active_order_ids.len();
            let mut i: u64 = 0;

            loop {
                if i >= len {
                    break;
                }

                let order_id = self.active_order_ids.at(i).read();
                let mut order = self.orders.read(order_id);

                if order.expiration <= current_time && order.active {
                    order.active = false;
                    self.orders.write(order_id, order);
                    self.emit(OrderExpired { order_id });
                }

                i += 1;
            };
        }
    }
}
