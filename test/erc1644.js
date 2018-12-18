import { catchRevert } from "./helpers/exceptions";
import { takeSnapshot, revertToSnapshot } from "./helpers/time";

const ERC1644Token = artifacts.require('./ERC1644Token.sol');

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ERC1644", accounts => {
    
let tokenOwner;
let controller;
let tokenHolder1;
let tokenHolder2;
let erc1644Token;
let erc1644TokenZero;

const empty_controller = "0x0000000000000000000000000000000000000000";

    before(async () => {
        tokenHolder1 = accounts[3];
        tokenHolder2 = accounts[2];
        controller = accounts[5];
        tokenOwner = accounts[4];
    });

    describe(`Test cases for the ERC1644 contract\n`, async () => {

      describe(`Test cases for the deployment of ERC1644 contract\n`, async() => {
        
        it("\t Should failed to deploy when the issuer address equals to the controller\n", async() => {
            await catchRevert(
                  ERC1644Token.new(tokenOwner, {from: tokenOwner})
            );
        });

        it("\t Should deploy the ERC1644 with the non-zero address of the controller\n", async () => {
            erc1644Token = await ERC1644Token.new(controller, {from: tokenOwner});
            assert.equal(await erc1644Token.controller.call(), controller, "Wrong address set");
        });

        it("\t Should deploy the ERC1644 with the zero address of the controller\n", async () => {
            erc1644TokenZero = await ERC1644Token.new(empty_controller, {from: tokenOwner});
            assert.equal(await erc1644TokenZero.controller.call(), empty_controller, "Wrong address set");
        });

      });

      describe("Test cases for isControllable()\n", async() => {

        it("\t Should return true when controller is non-zero address\n", async() => {
            assert.isTrue(await erc1644Token.isControllable.call());
        });

        it("\t Should return false when controller is zero address\n", async() => {
            assert.isFalse(await erc1644TokenZero.isControllable.call());
        });

      });

      describe("Test cases for the controllerTransfer()\n", async() => {

        it("\t Should revert during controllerTransfer() because msg.sender is not authorised\n", async() => {
            // Mint some tokens
            await erc1644Token.mint(tokenHolder1, web3.utils.toWei("500"), {from: tokenOwner});
            // check balance
            assert.equal(
              (await erc1644Token.balanceOf.call(tokenHolder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),
              500
            );
            await catchRevert(
                erc1644Token.controllerTransfer(tokenHolder1, tokenHolder2, web3.utils.toWei("200"), "0x0", "Stolen tokens", {from: tokenOwner})
            );
        });

        it("\t Should revert during controllerTransfer() when controller is zero address or `isControllable()` returns false\n", async() => {
            // Mint some tokens
            await erc1644TokenZero.mint(tokenHolder1, web3.utils.toWei("500"), {from: tokenOwner});
            // check balance
            assert.equal(
              (await erc1644TokenZero.balanceOf.call(tokenHolder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),
              500
            );
            assert.isFalse(await erc1644TokenZero.isControllable.call());
            await catchRevert(
              erc1644TokenZero.controllerTransfer(tokenHolder1, tokenHolder2, web3.utils.toWei("200"), "0x0", "Stolen tokens", {from: controller})
            );
        })

        it("\t Should revert during controllerTransfer() because _from doesn't have sufficent balance\n", async() => {
            await catchRevert(
              erc1644Token.controllerTransfer(tokenHolder1, tokenHolder2, web3.utils.toWei("600"), "0x0", "Stolen tokens", {from: controller})
            );
        });

        it("\t Should revert during controllerTransfer() because _to address is 0x\n", async() => {
            await catchRevert(
              erc1644Token.controllerTransfer(tokenHolder1, "0x0000000000000000000000000000000000000000", web3.utils.toWei("100"), "0x0", "Stolen tokens", {from: controller})
            );
        });

        it("\t Should sucessfully controllerTransfer() and verify the `ControllerTransfer` event params value\n", async() => {
            let tx = await erc1644Token.controllerTransfer(tokenHolder1, tokenHolder2, web3.utils.toWei("200"), "0x0", "Stolen tokens", {from: controller});
            // verify the value of the ControllerTransfer event
            assert.equal(tx.logs[1].args._controller, controller);
            assert.equal(tx.logs[1].args._from, tokenHolder1);
            assert.equal(tx.logs[1].args._to, tokenHolder2);
            assert.equal((tx.logs[1].args._value).dividedBy(new BigNumber(10).pow(18)).toNumber(), 200);
            assert.equal(web3.utils.toUtf8(tx.logs[1].args._operatorData), "Stolen tokens");

            // Verify the transfer event values
            assert.equal((await erc1644Token.balanceOf.call(tokenHolder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 300);
            assert.equal((await erc1644Token.balanceOf.call(tokenHolder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 200);            
        });

        it("\t Should revert after finalization of the controller feature\n", async() => {
            let sanpId = await takeSnapshot();

            await erc1644Token.finalizeControllable({from: tokenOwner});
            assert.isFalse(await erc1644Token.isControllable.call());
            await catchRevert(
                erc1644Token.controllerTransfer(tokenHolder1, tokenHolder2, web3.utils.toWei("100"), "0x0", "Stolen tokens", {from: controller})
            );

            await revertToSnapshot(sanpId);
        });
      });

      describe("Test cases for the controllerRedeem()\n", async() => {

        it("\t Should revert during controllerRedeem() because msg.sender is not authorised\n", async() => {
            await catchRevert(
                erc1644Token.controllerRedeem(tokenHolder2, web3.utils.toWei("100"), "0x0", "Incorrect receiver of tokens", {from: tokenOwner})
            );
        });

        it("\t Should revert during controllerRedeem() when controller is zero address or `isControllable()` returns false\n", async() => {
            assert.isFalse(await erc1644TokenZero.isControllable.call());
            await catchRevert(
              erc1644TokenZero.controllerRedeem(tokenHolder2, web3.utils.toWei("200"), "0x0", "Incorrect receiver of tokens", {from: controller})
            );
        })

        it("\t Should revert during controllerRedeem() because tokenHolder doesn't have sufficent balance\n", async() => {
            await catchRevert(
              erc1644Token.controllerRedeem(tokenHolder2, web3.utils.toWei("400"), "0x0", "Incorrect receiver of tokens", {from: controller})
            );
        });

        it("\t Should revert during controllerRedeem() because tokenHolder2 address is 0x\n", async() => {
            await catchRevert(
              erc1644Token.controllerRedeem("0x0000000000000000000000000000000000000000", web3.utils.toWei("200"), "0x0", "Incorrect receiver of tokens", {from: controller})
            );
        });

        it("\t Should sucessfully controllerRedeem() and verify the `ControllerRedeem` event params value\n", async() => {
            let tx = await erc1644Token.controllerRedeem(tokenHolder2, web3.utils.toWei("100"), "0x0", "Incorrect receiver of tokens", {from: controller});
            // verify the value of the ControllerRedeem event
            assert.equal(tx.logs[1].args._controller, controller);
            assert.equal(tx.logs[1].args._tokenHolder, tokenHolder2);
            assert.equal((tx.logs[1].args._value).dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
            assert.equal(web3.utils.toUtf8(tx.logs[1].args._operatorData), "Incorrect receiver of tokens");

            // Verify the transfer event values
            assert.equal((await erc1644Token.balanceOf.call(tokenHolder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
        });

        it("\t Should revert after finalization of the controller feature\n", async() => {
            await erc1644Token.finalizeControllable({from: tokenOwner});
            assert.isFalse(await erc1644Token.isControllable.call());
            await catchRevert(
                erc1644Token.controllerRedeem(tokenHolder2, web3.utils.toWei("50"), "0x0", "Incorrect receiver of tokens", {from: controller})
            );
        });
      });
    });
  });