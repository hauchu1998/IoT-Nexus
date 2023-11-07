import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function main() {
  let cc: Contract;
  let owner: SignerWithAddress;

  [owner] = await ethers.getSigners();
  const CompactCertificateSender = await ethers.getContractFactory("CCSender");

  console.log("Deploying CompactCertificateSender...");
  const router = process.env.SENDER_ROUTER || "";
  cc = await CompactCertificateSender.deploy(router, 10000);
  await cc.deployed();
  console.log(`CompactCertificateSender Deployed to -> ${cc.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
