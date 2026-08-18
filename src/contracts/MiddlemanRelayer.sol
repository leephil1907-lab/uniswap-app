/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity ^0.4.24;

import "./UnstructuredStorage.sol";

contract ReentrancyGuard {
    using UnstructuredStorage for bytes32;

    /* Hardcoded constants to save gas */
    bytes32 private constant REENTRANCY_MUTEX_POSITION = 0xe855346402235fdd185c890e68d2c4ecad599b88587635ee285bce2fda58dacb;

    string private constant ERROR_REENTRANT = "REENTRANCY_REENTRANT_CALL";

    modifier nonReentrant() {
        // Ensure mutex is unlocked
        require(!REENTRANCY_MUTEX_POSITION.getStorageBool(), ERROR_REENTRANT);

        // Lock mutex before function call
        REENTRANCY_MUTEX_POSITION.setStorageBool(true);

        // Perform function call
        _;

        // Unlock mutex after function call
        REENTRANCY_MUTEX_POSITION.setStorageBool(false);
    }
}

/**
 * @title SafeMath
 * @dev Math operations with safety checks that revert on error
 */
library SafeMath {
    string private constant ERROR_ADD_OVERFLOW = "MATH_ADD_OVERFLOW";
    string private constant ERROR_SUB_UNDERFLOW = "MATH_SUB_UNDERFLOW";
    string private constant ERROR_MUL_OVERFLOW = "MATH_MUL_OVERFLOW";
    string private constant ERROR_DIV_ZERO = "MATH_DIV_ZERO";

    /**
    * @dev Multiplies two numbers, reverts on overflow.
    */
    function mul(uint256 _a, uint256 _b) internal pure returns (uint256) {
        if (_a == 0) {
            return 0;
        }

        uint256 c = _a * _b;
        require(c / _a == _b, ERROR_MUL_OVERFLOW);

        return c;
    }

    /**
    * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
    */
    function div(uint256 _a, uint256 _b) internal pure returns (uint256) {
        require(_b > 0, ERROR_DIV_ZERO);
        uint256 c = _a / _b;

        return c;
    }

    /**
    * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 _a, uint256 _b) internal pure returns (uint256) {
        require(_b <= _a, ERROR_SUB_UNDERFLOW);
        uint256 c = _a - _b;

        return c;
    }

    /**
    * @dev Adds two numbers, reverts on overflow.
    */
    function add(uint256 _a, uint256 _b) internal pure returns (uint256) {
        uint256 c = _a + _b;
        require(c >= _a, ERROR_ADD_OVERFLOW);

        return c;
    }

    /**
    * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
    * reverts when dividing by zero.
    */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, ERROR_DIV_ZERO);
        return a % b;
    }
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 {
    function totalSupply() public view returns (uint256);

    function balanceOf(address _who) public view returns (uint256);

    function allowance(address _owner, address _spender)
        public view returns (uint256);

    function transfer(address _to, uint256 _value) public returns (bool);

    function approve(address _spender, uint256 _value)
        public returns (bool);

    function transferFrom(address _from, address _to, uint256 _value)
        public returns (bool);

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

library SignatureUtils {
    bytes4 internal constant ERC1271_IS_VALID_SIGNATURE_SELECTOR = 0x1626ba7e;

    function isValidSignature(
        address signer,
        bytes32 msgHash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (bool) {
        if (_hasCode(signer)) {
            bytes memory sig = abi.encodePacked(r, s, v);
            bytes memory data = abi.encodeWithSelector(ERC1271_IS_VALID_SIGNATURE_SELECTOR, msgHash, sig);
            bytes32 retval;
            assembly {
                let outDataOffset := mload(0x40)
                mstore(0x40, add(outDataOffset, 32))
                let success := staticcall(gas(), signer, add(data, 32), mload(data), outDataOffset, 32)
                if and(eq(success, 1), eq(returndatasize(), 32)) {
                    retval := mload(outDataOffset)
                }
            }
            return retval == bytes32(ERC1271_IS_VALID_SIGNATURE_SELECTOR);
        } else {
            return ECDSA.recover(msgHash, v, r, s) == signer;
        }
    }

    function _hasCode(address addr) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(addr) }
        return size > 0;
    }
}

library Math256 {
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function max(int256 a, int256 b) internal pure returns (int256) {
        return a > b ? a : b;
    }

    function min(int256 a, int256 b) internal pure returns (int256) {
        return a < b ? a : b;
    }

    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        return a == 0 ? 0 : (a - 1) / b + 1;
    }

    function absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a - b : b - a;
    }
}

library ECDSA {
    function recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal pure returns (address) {
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "ECDSA: invalid signature 's' value");

        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "ECDSA: invalid signature");

        return signer;
    }

    function recover(bytes32 hash, bytes32 r, bytes32 vs) internal pure returns (address) {
        bytes32 s;
        uint8 v;
        assembly {
            s := and(vs, 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
            v := add(shr(255, vs), 27)
        }
        return recover(hash, v, r, s);
    }
}

contract Versioned {
    event ContractVersionSet(uint256 version);

    bytes32 internal constant CONTRACT_VERSION_POSITION =
        0x4dd0f6662ba1d6b081f08b350f5e9a6a7b15cf586926ba66f753594928fa64a6;

    uint256 internal constant PETRIFIED_VERSION_MARK = uint256(-1);

    constructor() public {
        CONTRACT_VERSION_POSITION_setStorageUint256(PETRIFIED_VERSION_MARK);
    }

    function CONTRACT_VERSION_POSITION_setStorageUint256(uint256 val) internal {
        bytes32 slot = CONTRACT_VERSION_POSITION;
        assembly {
            sstore(slot, val)
        }
    }

    function getContractVersion() public view returns (uint256) {
        bytes32 slot = CONTRACT_VERSION_POSITION;
        uint256 version;
        assembly {
            version := sload(slot)
        }
        return version;
    }

    function _checkContractVersion(uint256 version) internal view {
        require(version == getContractVersion(), "UNEXPECTED_CONTRACT_VERSION");
    }

    function _setContractVersion(uint256 version) internal {
        CONTRACT_VERSION_POSITION_setStorageUint256(version);
        emit ContractVersionSet(version);
    }
}
