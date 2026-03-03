# Contributing to Phantom Darkpool

Thank you for your interest in contributing to Phantom Darkpool! This document provides guidelines and instructions for contributing to the project.

## Development Setup

Before contributing, ensure your development environment is properly set up:

1. **Install prerequisites** (see [SETUP.md](./SETUP.md)):
   - Node.js v20+
   - Rust and Cargo
   - Circom compiler
   - Cairo toolchain (Scarb)

2. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd phantom-darkpool
   npm install
   ```

3. **Verify setup**:
   ```bash
   # On Unix/Linux/macOS
   bash scripts/verify-setup.sh
   
   # On Windows
   powershell scripts/verify-setup.ps1
   ```

4. **Quick start**:
   ```bash
   bash scripts/quick-start.sh
   ```

## Project Structure

Understanding the project structure will help you navigate the codebase:

```
phantom-darkpool/
├── packages/
│   ├── backend/          # Express.js API and matching engine
│   ├── circuits/         # Circom zero-knowledge circuits
│   ├── contracts/        # Cairo smart contracts
│   ├── sdk/              # Client SDK for proof generation
│   └── integration/      # End-to-end integration tests
├── product demo/         # Next.js frontend (complete)
├── .kiro/specs/          # Specification documents
└── scripts/              # Development scripts
```

## Development Workflow

### 1. Follow the Implementation Plan

The project follows a structured implementation plan defined in `.kiro/specs/phantom-darkpool/tasks.md`. Each task:
- Has clear acceptance criteria
- References specific requirements
- Includes sub-tasks for granular progress tracking

### 2. Branch Naming Convention

Use descriptive branch names:
- `feature/task-X-description` - For new features
- `fix/issue-description` - For bug fixes
- `docs/description` - For documentation updates
- `test/description` - For test additions

Example: `feature/task-2-cryptographic-primitives`

### 3. Commit Messages

Follow conventional commit format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or modifications
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

Example:
```
feat(sdk): implement Poseidon hash wrapper

- Add TypeScript wrapper for circomlibjs Poseidon
- Create type-safe interfaces for hash operations
- Add unit tests for hash functions

Refs: Task 2.1, Requirements 1.4, 8.1
```

### 4. Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Format code
npm run format
```

**TypeScript Guidelines**:
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Avoid `any` type (use `unknown` if necessary)
- Use meaningful variable and function names

**Cairo Guidelines**:
- Follow Cairo naming conventions
- Add comprehensive comments for complex logic
- Use explicit types
- Document all public functions

**Circom Guidelines**:
- Add comments explaining circuit constraints
- Use descriptive signal names
- Document public and private inputs
- Include constraint count estimates

### 5. Testing Requirements

All contributions must include appropriate tests:

**Unit Tests** (Jest):
```typescript
// packages/sdk/src/__tests__/poseidon.test.ts
describe('Poseidon Hash', () => {
  it('should generate consistent hashes', () => {
    const input = [1n, 2n, 3n];
    const hash1 = poseidon(input);
    const hash2 = poseidon(input);
    expect(hash1).toBe(hash2);
  });
});
```

**Circuit Tests**:
```typescript
// packages/circuits/tests/BalanceProof.test.ts
describe('Balance Proof Circuit', () => {
  it('should verify valid balance proof', async () => {
    const witness = await calculateWitness(circuit, inputs);
    expect(witness[0]).toBe(1n); // Valid proof
  });
});
```

**Integration Tests**:
```typescript
// packages/integration/tests/deposit-withdraw.test.ts
describe('Deposit to Withdrawal Flow', () => {
  it('should complete full flow', async () => {
    // Test end-to-end flow
  });
});
```

Run tests before submitting:
```bash
npm test
```

### 6. Documentation

Update documentation when:
- Adding new features
- Changing APIs
- Modifying configuration
- Adding dependencies

Documentation locations:
- Package README files: `packages/*/README.md`
- API documentation: Inline JSDoc comments
- Architecture changes: Update `design.md`
- New requirements: Update `requirements.md`

### 7. Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/task-X-description
   ```

2. **Make your changes**:
   - Follow the implementation plan
   - Write tests
   - Update documentation

3. **Verify your changes**:
   ```bash
   npm run lint
   npm run format
   npm test
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/task-X-description
   ```

6. **Create a Pull Request**:
   - Provide a clear description
   - Reference related tasks/issues
   - Include test results
   - Add screenshots for UI changes

7. **Address review feedback**:
   - Respond to comments
   - Make requested changes
   - Update tests if needed

## Task Implementation Guidelines

### Task Selection

1. Check `tasks.md` for available tasks
2. Ensure prerequisites are complete
3. Understand the requirements being addressed
4. Review the design document for context

### Task Execution

1. **Update task status** to "in progress"
2. **Implement the feature** following the design
3. **Write tests** (unit, integration, property-based)
4. **Update documentation**
5. **Run all tests** to ensure nothing breaks
6. **Update task status** to "completed"

### Property-Based Testing

For tasks marked with `*` (optional property tests):
- Use fast-check or similar library
- Test universal properties, not specific examples
- Document the property being tested
- Reference the property number from design.md

Example:
```typescript
// Property 1: Balance Note Creation from Deposits
fc.assert(
  fc.property(fc.bigInt(), fc.bigInt(), (asset, amount) => {
    const note = createBalanceNote(asset, amount);
    return note.asset === asset && note.amount === amount;
  })
);
```

## Package-Specific Guidelines

### Backend Package

- Use Express.js best practices
- Implement proper error handling
- Add request validation
- Use async/await for asynchronous operations
- Add logging for debugging

### Circuits Package

- Test circuits thoroughly before deployment
- Document constraint counts
- Optimize for proof generation time
- Verify circuit correctness with multiple test cases

### Contracts Package

- Follow Cairo best practices
- Add comprehensive tests
- Document gas costs
- Consider upgrade patterns

### SDK Package

- Provide clear API documentation
- Handle errors gracefully
- Support both browser and Node.js environments
- Optimize for bundle size

## Getting Help

If you need help:
1. Review the specification documents in `.kiro/specs/phantom-darkpool/`
2. Check existing code for examples
3. Read the design document for architecture details
4. Ask questions in pull request comments

## Code Review Process

All contributions go through code review:
- At least one approval required
- All tests must pass
- Code must follow style guidelines
- Documentation must be updated

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

If you have questions about contributing, please open an issue or reach out to the maintainers.

Thank you for contributing to Phantom Darkpool! 🚀
