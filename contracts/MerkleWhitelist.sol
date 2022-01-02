//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleWhitelist is Ownable {
  bytes32 public whitelistMerkleRoot;
  string public whitelistURI;

  /*
  READ FUNCTIONS
  */

  function verifySender(bytes32[] memory proof) public view returns (bool) {
    return _verify(proof, _hash(msg.sender));
  }

  function _verify(bytes32[] memory proof, bytes32 addressHash)
    internal
    view
    returns (bool)
  {
    return MerkleProof.verify(proof, whitelistMerkleRoot, addressHash);
  }

  function _hash(address _address) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(_address));
  }

  /*
  OWNER FUNCTIONS
  */

  function setWhitelistMerkleRoot(bytes32 merkleRoot) external onlyOwner {
    whitelistMerkleRoot = merkleRoot;
  }

  function setWhitelistURI(string calldata _whitelistURI) external onlyOwner {
    whitelistURI = _whitelistURI;
  }

  /*
  MODIFIER
  */
  modifier onlyWhitelist(bytes32[] memory proof) {
    require(verifySender(proof), "MerkleWhitelist: Caller is not whitelisted");
    _;
  }
}
