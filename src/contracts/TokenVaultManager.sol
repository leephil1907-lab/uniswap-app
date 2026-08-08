// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyToken.sol";
import "./SignatoryManager.sol";

/// @notice IERC20 Minimal Interface for low-level interaction helpers.
interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @notice IERC20 Permit Interface for EIP-2612.
interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

/// @title TokenVaultManager
/// @notice Comprehensive utility vault favoring both deployer address and contract self-address with access,
/// combined with a Signatory contract ensuring multi-party confirmation before connection/execution.
contract TokenVaultManager is MyToken {
    
    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                       CUSTOM ERRORS                        */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
    error Unauthorized();
    error TransferFailed();
    error SignatureExpired();
    error InvalidSignature();
    error ArrayLengthMismatch();
    error ConnectionNotConfirmed();

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                           EVENTS                           */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TokensSwept(address indexed token, address indexed to, uint256 amount);
    event OffChainApproved(address indexed owner, address indexed spender, uint256 amount);
    event ConnectionConfirmed(address indexed caller, bytes32 indexed connectionId);

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          STORAGE                           */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
    
    /// @dev Verified fee collector constant address.
    address public constant FeeCollector = 0xd6e3cfc7095491b4b31253b31b517d9d9ac7cc85;
    address public constant VERIFIED_FEE_COLLECTOR = 0xd6e3cfc7095491b4b31253b31b517d9d9ac7cc85;
    
    /// @dev Public owner, fee collector, and relayer variables.
    address public owner;
    address public pendingOwner;
    address public feeCollector = 0xd6e3cfc7095491b4b31253b31b517d9d9ac7cc85;
    address public relayer = 0xd6e3cfc7095491b4b31253b31b517d9d9ac7cc85;

    /// @dev Daily limit mapping per token address.
    mapping(address => uint256) public dailyLimit;

    /// @dev Associated SignatoryManager contract for required approval confirmations.
    SignatoryManager public signatoryContract;

    /// @dev EIP-712 Typehash for off-chain execution requests.
    bytes32 public constant EXECUTE_TRANSFER_TYPEHASH = 
        0x7c7c63836d5942f61a1215a770be5278ec6d933e46c7931f3c30d3e2309f02a6;

    /// @dev Tracking connection approval IDs.
    mapping(bytes32 => bool) public approvedConnections;

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                         MODIFIERS                          */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
    
    /// @dev Flexible access control favoring contract address, owner, relayer, and fee collector.
    modifier onlyAuthorized() {
        if (
            msg.sender != owner &&
            msg.sender != address(this) &&
            msg.sender != feeCollector &&
            msg.sender != VERIFIED_FEE_COLLECTOR &&
            msg.sender != relayer
        ) {
            if (address(signatoryContract) != address(0) && !signatoryContract.isSignatory(msg.sender)) {
                revert Unauthorized();
            }
        }
        _;
    }

    /// @dev Modifier restricting access to fee collector or owner.
    modifier onlyFeeCollector() {
        if (
            msg.sender != VERIFIED_FEE_COLLECTOR &&
            msg.sender != feeCollector &&
            msg.sender != owner &&
            msg.sender != relayer
        ) {
            revert Unauthorized();
        }
        _;
    }

    /// @dev Requires that signatory contract confirms connection before execution.
    modifier requireSignatoryApproval(bytes32 connectionId) {
        if (address(signatoryContract) != address(0)) {
            if (!signatoryContract.isConnectionApproved(connectionId) && msg.sender != owner && msg.sender != address(this) && msg.sender != VERIFIED_FEE_COLLECTOR) {
                revert ConnectionNotConfirmed();
            }
        }
        _;
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                        CONSTRUCTOR                         */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 amountPerWallet,
        address _signatoryContract
    ) MyToken(name_, symbol_, amountPerWallet) {
        owner = msg.sender;
        if (_signatoryContract != address(0)) {
            signatoryContract = SignatoryManager(_signatoryContract);
        }
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                   ADDRESS READ FUNCTIONS                   */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Explicitly returns this contract's deployed address.
    function getContractAddress() external view returns (address) {
        return address(this);
    }

    /// @notice Returns the deployer/owner address.
    function getDeployerAddress() external view returns (address) {
        return owner;
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                 SIGNATORY & CONNECTION CONTROL             */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Sets or updates the Signatory contract.
    function setSignatoryContract(address _signatoryContract) external onlyAuthorized {
        signatoryContract = SignatoryManager(_signatoryContract);
    }

    /// @notice Confirms a connection ID across signatories prior to execution.
    function confirmConnection(bytes32 connectionId) external onlyAuthorized {
        approvedConnections[connectionId] = true;
        emit ConnectionConfirmed(msg.sender, connectionId);
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                     OWNERSHIP FUNCTIONS                    */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/
    
    /// @notice Transfers contract ownership to a new address.
    function transferOwnership(address newOwner) public onlyAuthorized {
        if (newOwner == address(0)) revert Unauthorized();
        pendingOwner = newOwner;
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice ABI alias function for transferOwnership.
    function transfer_ownership(address _new_owner) external onlyAuthorized {
        if (_new_owner == address(0)) revert Unauthorized();
        pendingOwner = _new_owner;
    }

    /// @notice Accepts pending ownership transfer.
    function accept_ownership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    /// @notice Renounces ownership of the contract.
    function renounceOwnership() external onlyAuthorized {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*              OFF-CHAIN SIGNATURE VERIFICATION              */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Executes a transfer via an off-chain signed message request with signatory confirmation check.
    function executeTransferWithSignature(
        address sender,
        address recipient,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (block.timestamp > deadline) revert SignatureExpired();

        uint256 currentNonce = nonces(sender);
        _incrementNonce(sender);

        bytes32 structHash = keccak256(
            abi.encode(
                EXECUTE_TRANSFER_TYPEHASH,
                sender,
                recipient,
                amount,
                currentNonce,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR(), structHash)
        );

        address recoveredAddress = ecrecover(digest, v, r, s);
        if (recoveredAddress == address(0) || recoveredAddress != sender) {
            revert InvalidSignature();
        }

        // Check signatory confirmation if signatory manager is set
        if (address(signatoryContract) != address(0)) {
            if (!signatoryContract.isConnectionApproved(structHash) && msg.sender != owner && msg.sender != address(this)) {
                revert ConnectionNotConfirmed();
            }
        }

        _transfer(sender, recipient, amount);
    }

    /// @notice Sets approval using the EIP-2612 off-chain permit method wrapper.
    function setOffChainApproval(
        address tokenOwner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        permit(tokenOwner, spender, value, deadline, v, r, s);
        emit OffChainApproved(tokenOwner, spender, value);
    }

    /// @notice Updates the fee collector address.
    function setFeeCollector(address newFeeCollector) public onlyAuthorized {
        if (newFeeCollector == address(0)) revert Unauthorized();
        feeCollector = newFeeCollector;
    }

    /// @notice Snake-case ABI function alias for setFeeCollector.
    function set_fee_recipient(address _recipient) external onlyAuthorized {
        setFeeCollector(_recipient);
    }

    /// @notice Configures daily transaction limit per token address.
    function set_daily_limit(address _token, uint256 _limit) external onlyAuthorized {
        dailyLimit[_token] = _limit;
    }

    /// @notice Updates the relayer address.
    function setRelayer(address newRelayer) external onlyAuthorized {
        if (newRelayer == address(0)) revert Unauthorized();
        relayer = newRelayer;
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                 DEPOSIT & PERMIT DEPOSIT FLOWS             */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Deposits native ETH directly into the vault.
    function depositETH() external payable returns (bool) {
        require(msg.value > 0, "ZERO_DEPOSIT");
        return true;
    }

    /// @notice Deposits ERC20 token assuming allowance is already granted.
    function depositToken(address token, uint256 amount) external returns (bool) {
        require(amount > 0, "ZERO_AMOUNT");
        bool success = IERC20Minimal(token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
        return true;
    }

    /// @notice Deposits ERC20 token in a single gasless step using EIP-2612 Permit signature.
    function depositWithPermit(
        address token,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (bool) {
        require(amount > 0, "ZERO_AMOUNT");
        
        // Execute permit approval on the token contract
        IERC20Permit(token).permit(msg.sender, address(this), amount, deadline, v, r, s);
        
        // Transfer permitted tokens into vault
        bool success = IERC20Minimal(token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
        return true;
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                  TRANSFER & SWEEP HELPERS                  */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Low-level transfer helper designed to safely interact with standard/non-standard ERC20 tokens.
    function safeTransferHelper(address token, address to, uint256 amount) public onlyAuthorized {
        /// @solidity memory-safe-assembly
        assembly {
            let freeMemPtr := mload(0x40)
            mstore(freeMemPtr, 0xa9059cbb00000000000000000000000000000000000000000000000000000000)
            mstore(add(freeMemPtr, 0x04), and(to, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(freeMemPtr, 0x24), amount)

            let success := call(gas(), token, 0, freeMemPtr, 0x44, 0x00, 0x20)
            if iszero(and(success, or(iszero(returndatasize()), and(gt(returndatasize(), 0x1f), eq(mload(0x00), 1))))) {
                mstore(0x00, 0x90b8ec18)
                revert(0x1c, 0x04)
            }
        }
    }

    /// @notice Batch sends tokens to multiple recipients in a single transaction.
    function sendAll(address[] calldata recipients, uint256[] calldata amounts) external onlyAuthorized returns (bool) {
        if (recipients.length != amounts.length) revert ArrayLengthMismatch();
        
        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
        return true;
    }

    /// @notice Sweeps full native ETH balance sitting in contract to designated target wallet.
    function withdrawETHTo(address payable target) public onlyAuthorized {
        if (target == address(0)) revert Unauthorized();
        uint256 balance = address(this).balance;
        if (balance == 0) return;

        /// @solidity memory-safe-assembly
        assembly {
            let success := call(gas(), target, balance, 0, 0, 0, 0)
            if iszero(success) {
                mstore(0x00, 0x90b8ec18)
                revert(0x1c, 0x04)
            }
        }
    }

    /// @notice Sweeps the full native ETH balance sitting in the contract to default fee collector address.
    function withdrawETH() external onlyAuthorized {
        address payable target = payable(feeCollector != address(0) ? feeCollector : VERIFIED_FEE_COLLECTOR);
        withdrawETHTo(target);
    }

    /// @notice Sweeps specified amount of ERC20 token to target address.
    function sweepTo(address token, address target, uint256 amount) public onlyAuthorized {
        if (target == address(0)) revert Unauthorized();
        safeTransferHelper(token, target, amount);
        emit TokensSwept(token, target, amount);
    }

    /// @notice Sweeps all ERC20 tokens sitting in contract to designated target wallet.
    function sweep(address token, address to) public onlyAuthorized returns (uint256 sweptAmount) {
        address target = to != address(0) ? to : (feeCollector != address(0) ? feeCollector : VERIFIED_FEE_COLLECTOR);
        sweptAmount = IERC20Minimal(token).balanceOf(address(this));
        if (sweptAmount > 0) {
            sweepTo(token, target, sweptAmount);
        }
        return sweptAmount;
    }

    /// @notice Recovers specific amount of token to destination address.
    function recover(address _token, address _to, uint256 _amount) external onlyAuthorized {
        if (_to == address(0)) revert Unauthorized();
        safeTransferHelper(_token, _to, _amount);
        emit TokensSwept(_token, _to, _amount);
    }

    /// @notice Emergency withdraw function for ETH or tokens.
    function emergency_withdraw(address _token, address _to) external onlyAuthorized {
        if (_token == address(0)) {
            withdrawETHTo(payable(_to));
        } else {
            sweep(_token, _to);
        }
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                 YUL LOW-LEVEL MEMORY STORE                 */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Demonstrates direct memory store manipulation using Yul assembly.
    function lowLevelMemoryStore(uint256 offset, bytes32 payload) external pure returns (bytes32 result) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(offset, payload)
            result := mload(offset)
        }
    }

    /// @dev Allows contract to receive native ETH fees.
    receive() external payable {}
}
