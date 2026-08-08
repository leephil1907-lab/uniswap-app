// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SignatoryManager
/// @notice Signatory contract requiring designated signatories to confirm approvals
/// before getting connected or executing vaulted operations.
contract SignatoryManager {
    error NotSignatory();
    error AlreadyConfirmed();
    error ConfirmationRequired();

    event SignatoryAdded(address indexed signatory);
    event SignatoryRemoved(address indexed signatory);
    event ApprovalConfirmed(address indexed signatory, bytes32 indexed requestId);
    event ConnectionApproved(bytes32 indexed requestId, uint256 confirmCount);

    address[] public signatories;
    mapping(address => bool) public isSignatory;
    mapping(bytes32 => mapping(address => bool)) public hasConfirmed;
    mapping(bytes32 => uint256) public confirmationCount;
    uint256 public requiredConfirmations;

    constructor(address[] memory initialSignatories, uint256 _requiredConfirmations) {
        require(_requiredConfirmations > 0 && _requiredConfirmations <= initialSignatories.length, "Invalid required count");
        for (uint256 i = 0; i < initialSignatories.length; i++) {
            address sig = initialSignatories[i];
            require(sig != address(0) && !isSignatory[sig], "Invalid or duplicate signatory");
            isSignatory[sig] = true;
            signatories.push(sig);
            emit SignatoryAdded(sig);
        }
        requiredConfirmations = _requiredConfirmations;
    }

    modifier onlySignatory() {
        if (!isSignatory[msg.sender]) revert NotSignatory();
        _;
    }

    /// @notice Confirms approval for a given connection or request ID.
    function confirmApproval(bytes32 requestId) external onlySignatory {
        if (hasConfirmed[requestId][msg.sender]) revert AlreadyConfirmed();
        hasConfirmed[requestId][msg.sender] = true;
        confirmationCount[requestId] += 1;

        emit ApprovalConfirmed(msg.sender, requestId);

        if (confirmationCount[requestId] >= requiredConfirmations) {
            emit ConnectionApproved(requestId, confirmationCount[requestId]);
        }
    }

    /// @notice Returns true if a connection or request has achieved required signatory approvals.
    function isConnectionApproved(bytes32 requestId) public view returns (bool) {
        return confirmationCount[requestId] >= requiredConfirmations;
    }

    /// @notice Helper to get all registered signatories.
    function getSignatories() external view returns (address[] memory) {
        return signatories;
    }
}
