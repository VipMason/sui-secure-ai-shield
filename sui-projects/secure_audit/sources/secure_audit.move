/// Module: secure_audit
/// Security Audit Contract for SecureAI Shield
/// Stores security events and audit logs on Sui blockchain

module secure_audit::secure_audit;

use sui::object::{Self, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use std::string::String;

// Security event types
public struct SecurityEvent has key, store {
    id: UID,
    event_type: String,
    risk_score: u8,
    description: String,
    operator: address,
    timestamp: u64,
    blocked: bool,
}

// Audit store for managing events
public struct AuditStore has key, store {
    id: UID,
    owner: address,
    event_count: u64,
}

// Create a new audit store
public fun create_audit_store(ctx: &mut TxContext) {
    let store = AuditStore {
        id: object::new(ctx),
        owner: tx_context::sender(ctx),
        event_count: 0,
    };
    transfer::transfer(store, tx_context::sender(ctx));
}

// Log a security event
public fun log_event(
    store: &mut AuditStore,
    event_type: String,
    risk_score: u8,
    description: String,
    blocked: bool,
    ctx: &mut TxContext
) {
    let event = SecurityEvent {
        id: object::new(ctx),
        event_type,
        risk_score,
        description,
        operator: tx_context::sender(ctx),
        timestamp: tx_context::epoch_timestamp_ms(ctx),
        blocked,
    };
    
    store.event_count = store.event_count + 1;
    
    // Transfer event to sender (they can keep track of their own events)
    transfer::transfer(event, tx_context::sender(ctx));
}

// Log injection detection event
public fun log_injection(
    store: &mut AuditStore,
    description: String,
    risk_score: u8,
    blocked: bool,
    ctx: &mut TxContext
) {
    log_event(store, b"injection_attempt".to_string(), risk_score, description, blocked, ctx);
}

// Log unauthorized access attempt
public fun log_unauthorized(
    store: &mut AuditStore,
    description: String,
    blocked: bool,
    ctx: &mut TxContext
) {
    log_event(store, b"unauthorized_access".to_string(), 100, description, blocked, ctx);
}

// Log wallet transfer attempt (for Wallet Air-Gap)
public fun log_wallet_transfer(
    store: &mut AuditStore,
    amount: u64,
    recipient: address,
    approved: bool,
    ctx: &mut TxContext
) {
    let risk_score = if (approved) { 0 } else { 100 };
    let description = format_transfer(amount, recipient);
    log_event(store, b"wallet_transfer".to_string(), risk_score, description, !approved, ctx);
}

// Helper function to format transfer info
fun format_transfer(amount: u64, recipient: address): String {
    // Simple formatting - in production use string formatting
    b"Transfer to recipient".to_string()
}

// Get event count
public fun get_event_count(store: &AuditStore): u64 {
    store.event_count
}

// Get store owner
public fun get_owner(store: &AuditStore): address {
    store.owner
}
