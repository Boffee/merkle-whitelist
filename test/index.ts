import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";
import { MerkleWhitelist } from "../typechain";

const ONLY_OWNER_ERROR = "Ownable: caller is not the owner";

describe("MerkleWhitelist", () => {
  let owner: SignerWithAddress;
  let stakingAddr: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;
  let contract: MerkleWhitelist;
  let ownerContract: MerkleWhitelist;

  beforeEach("deploy and connect contracts", async () => {
    [owner, stakingAddr, addr1, addr2, addr3, addr4] =
      await ethers.getSigners();
    const Contract = await ethers.getContractFactory("MerkleWhitelist");
    ownerContract = await Contract.deploy();
    contract = ownerContract.connect(addr1);

    await contract.deployed();
  });

  describe("setWhitelist", () => {
    let merkleTree: MerkleTree;
    let root: string;

    beforeEach("setup whitelist", () => {
      merkleTree = getMerkleTree([
        owner.address,
        addr1.address,
        addr2.address,
        addr3.address,
        addr4.address,
      ]);
      root = merkleTree.getHexRoot();
    });

    it("should set whitelist", async () => {
      await ownerContract.setWhitelistMerkleRoot(root);
      expect(await contract.whitelistMerkleRoot()).eq(root);
    });

    it("should fail to setWhitelist if not owner", async () => {
      await expect(contract.setWhitelistMerkleRoot(root)).revertedWith(
        ONLY_OWNER_ERROR
      );
      await expect(
        contract.connect(addr3).setWhitelistMerkleRoot(root)
      ).revertedWith(ONLY_OWNER_ERROR);
    });
  });

  describe("verifySender", () => {
    let merkleTree: MerkleTree;
    let root: string;
    let proof1: string[];
    let proof2: string[];
    let proof3: string[];
    let proof4: string[];

    beforeEach("setup whitelist", async () => {
      merkleTree = getMerkleTree([
        owner.address,
        addr1.address,
        addr2.address,
        addr3.address,
        addr4.address,
      ]);
      root = merkleTree.getHexRoot();
      proof1 = merkleTree.getHexProof(keccak256(addr1.address));
      proof2 = merkleTree.getHexProof(keccak256(addr2.address));
      proof3 = merkleTree.getHexProof(keccak256(addr3.address));
      proof4 = merkleTree.getHexProof(keccak256(addr4.address));
      await ownerContract.setWhitelistMerkleRoot(root);
    });

    it("should verify sender", async () => {
      expect(await contract.verifySender(proof1)).eq(true);
      expect(await contract.connect(addr2).verifySender(proof2)).eq(true);
      expect(await contract.connect(addr3).verifySender(proof3)).eq(true);
      expect(await contract.connect(addr4).verifySender(proof4)).eq(true);
    });

    it("should fail to verify sender if not whitelisted", async () => {
      expect(await contract.verifySender(proof3)).eq(false);
      expect(await contract.connect(addr3).verifySender(proof4)).eq(false);
    });
  });
});

const getMerkleTree = (addresses: string[]) => {
  const leaves = addresses.map((x) => keccak256(x));
  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  return tree;
};
