// Phantom Darkpool Contracts
// Cairo smart contracts for Starknet

mod shielded_vault;
mod order_registry;
mod settlement;
mod audit_gateway;

// Re-export main interfaces
pub use shielded_vault::{IShieldedVault, IShieldedVaultDispatcher, IShieldedVaultDispatcherTrait};
pub use order_registry::{IOrderRegistry, IOrderRegistryDispatcher, IOrderRegistryDispatcherTrait};
pub use settlement::{ISettlement, ISettlementDispatcher, ISettlementDispatcherTrait};
pub use audit_gateway::{IAuditGateway, IAuditGatewayDispatcher, IAuditGatewayDispatcherTrait};
