import {ethers, network} from "hardhat";
import { expect } from "chai";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {
    EVMWriter,
    NodeDriver,
    NodeDriverAuth,
    SFCLib,
    UnitTestConstantsManager,
    UnitTestNetworkInitializer,
    UnitTestSFC
} from "../typechain-types";
import {beforeEach} from "mocha";
import {BlockchainNode} from "./helpers/BlockchainNode";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";

describe('SFC', () => {
    const fixture = async () => {
        const [ owner, user ] = await ethers.getSigners();
        const sfc: UnitTestSFC = await ethers.deployContract("UnitTestSFC");
        const nodeDriver: NodeDriver = await ethers.deployContract("NodeDriver");
        const evmWriter: EVMWriter = await ethers.deployContract("StubEvmWriter");
        const nodeDriverAuth: NodeDriverAuth = await ethers.deployContract("NodeDriverAuth");
        const sfcLib: SFCLib = await ethers.deployContract("UnitTestSFCLib");
        const initializer: UnitTestNetworkInitializer = await ethers.deployContract("UnitTestNetworkInitializer");

        await initializer.initializeAll(0, 0, sfc, sfcLib, nodeDriverAuth, nodeDriver, evmWriter, owner);
        const constants: UnitTestConstantsManager = await ethers.getContractAt("UnitTestConstantsManager", await sfc.constsAddress());
        await sfc.rebaseTime();

        const callLibMethod = async (method: string, args: any[], sender: HardhatEthersSigner = owner, ether: string = '0') => {
            return sender.sendTransaction({
                to: sfc,
                value: ethers.parseEther(ether),
                // @ts-ignore
                data: sfcLib.interface.encodeFunctionData(method, args)
            });
        };

        const readLibData = async (method: string, args: any[]) => {
            const res = await owner.call({
                to: sfc,
                // @ts-ignore
                data: sfcLib.interface.encodeFunctionData(method, args)
            });
            // @ts-ignore
            const decoded = sfcLib.interface.decodeFunctionResult(method, res);
            return decoded.length === 1 ? decoded[0] : [...decoded];
        }

        return {
            owner,
            user,
            sfc,
            evmWriter,
            nodeDriver,
            nodeDriverAuth,
            sfcLib,
            constants,
            callLibMethod,
            readLibData
        }
    }

    beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
    });

    // it('Should revert when amount sent', async function () {
    //     await expect(this.owner.sendTransaction({
    //         to: this.sfc,
    //         value: 1
    //     })).to.revertedWith('transfers not allowed');
    // });
    //
    // describe('Genesis validator', () => {
    //     beforeEach(async function () {
    //         const validator = ethers.Wallet.createRandom();
    //         await this.sfc.enableNonNodeCalls();
    //         await expect(
    //             this.callLibMethod(
    //                 "setGenesisValidator",
    //                 [validator.address, 1, validator.publicKey, 1 << 3, await this.sfc.currentEpoch(), Date.now(), 0, 0]
    //             )
    //         ).to.be.fulfilled;
    //         await this.sfc.disableNonNodeCalls();
    //     });
    //
    //     it('Should succeed and set genesis validator with bad status', async function () {
    //         await expect(this.sfc._syncValidator(1, false)).to.be.fulfilled;
    //     });
    //
    //     it('Should revert when sealEpoch not called by node', async function () {
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 0))
    //             .to.be.revertedWith('caller is not the NodeDriverAuth contract');
    //     });
    //
    //     it('Should revert when SealEpochValidators not called by node', async function () {
    //         await expect(this.sfc.sealEpochValidators([1]))
    //             .to.be.revertedWith('caller is not the NodeDriverAuth contract');
    //     });
    // });
    //
    // describe('Constants', () => {
    //     it('Should succeed and return now()', async function () {
    //         const block = await ethers.provider.getBlock('latest');
    //         expect(block).to.not.be.null;
    //         expect(await this.sfc.getBlockTime()).to.be.within(block!.timestamp - 100, block!.timestamp + 100);
    //     });
    //
    //     it('Should succeed and return getTime()', async function () {
    //         const block = await ethers.provider.getBlock('latest');
    //         expect(block).to.not.be.null;
    //         expect(await this.sfc.getTime()).to.be.within(block!.timestamp - 100, block!.timestamp + 100);
    //     });
    //
    //     it('Should succeed and return current epoch', async function () {
    //         expect(await this.sfc.currentEpoch()).to.equal(1);
    //     });
    //
    //     it('Should succeed and return current sealed epoch', async function () {
    //         expect(await this.sfc.currentSealedEpoch()).to.equal(0);
    //     });
    //
    //     it('Should succeed and return minimum amount to stake for validator', async function () {
    //         expect(await this.constants.minSelfStake()).to.equal(ethers.parseEther('0.3175'));
    //     });
    //
    //     it('Should succeed and return maximum ratio of delegations a validator can have', async function () {
    //         expect(await this.constants.maxDelegatedRatio()).to.equal(ethers.parseEther('16'));
    //     });
    //
    //     it('Should succeed and return commission fee in percentage a validator will get from a delegation', async function () {
    //         expect(await this.constants.validatorCommission()).to.equal(ethers.parseEther('0.15'));
    //     });
    //
    //     it('Should succeed and return burnt fee share', async function () {
    //         expect(await this.constants.burntFeeShare()).to.equal(ethers.parseEther('0.2'));
    //     });
    //
    //     it('Should succeed and return treasury fee share', async function () {
    //         expect(await this.constants.treasuryFeeShare()).to.equal(ethers.parseEther('0.1'));
    //     });
    //
    //     it('Should succeed and return ratio of the reward rate at base rate (without lockup)', async function () {
    //         expect(await this.constants.unlockedRewardRatio()).to.equal(ethers.parseEther('0.3'));
    //     });
    //
    //     it('Should succeed and return minimum duration of a stake/delegation lockup', async function () {
    //         expect(await this.constants.minLockupDuration()).to.equal(86400 * 14);
    //     });
    //
    //     it('Should succeed and return maximum duration of a stake/delegation lockup', async function () {
    //         expect(await this.constants.maxLockupDuration()).to.equal(86400 * 365);
    //     });
    //
    //     it('Should succeed and return period of time that stake is locked', async function () {
    //         expect(await this.constants.withdrawalPeriodTime()).to.equal(60 * 60 * 24 * 7);
    //     });
    //
    //     it('Should succeed and return number of epochs that stake is locked', async function () {
    //         expect(await this.constants.withdrawalPeriodEpochs()).to.equal(3);
    //     });
    //
    //     it('Should succeed and return version of the current implementation', async function () {
    //         expect(await this.sfc.version()).to.equal(ethers.hexlify(ethers.toUtf8Bytes("305")));
    //     });
    // });
    //
    // describe('Create validator', () => {
    //     const validatorsFixture = async () => {
    //         const [ validator, secondValidator ] = await ethers.getSigners();
    //         return {
    //             validator,
    //             secondValidator
    //         }
    //     }
    //
    //     beforeEach(async function () {
    //         Object.assign(this, await loadFixture(validatorsFixture));
    //     });
    //
    //     it('Should succeed and create a validator and return its id', async function () {
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.validator, '0.4')
    //         ).to.be.fulfilled;
    //         expect(await this.sfc.lastValidatorID()).to.equal(1);
    //     });
    //
    //     it('Should revert when insufficient self-stake to create a validator', async function () {
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.validator, '0.1')
    //         ).to.be.revertedWith('insufficient self-stake');
    //     });
    //
    //     it('Should revert when public key is empty while creating a validator', async function () {
    //         await expect(
    //             this.callLibMethod("createValidator", ["0x"], this.validator, '0.4')
    //         ).to.be.revertedWith('empty pubkey');
    //     });
    //
    //     it('Should succeed and create two validators and return id of last validator', async function () {
    //         expect(await this.sfc.lastValidatorID()).to.equal(0);
    //         expect(await this.sfc.getValidatorID(this.validator)).to.equal(0);
    //         expect(await this.sfc.getValidatorID(this.secondValidator)).to.equal(0);
    //
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.validator, '0.4')
    //         ).to.be.fulfilled;
    //         expect(await this.sfc.getValidatorID(this.validator)).to.equal(1);
    //         expect(await this.sfc.lastValidatorID()).to.equal(1);
    //
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.secondValidator, '0.5')
    //         ).to.be.fulfilled;
    //         expect(await this.sfc.getValidatorID(this.secondValidator)).to.equal(2);
    //         expect(await this.sfc.lastValidatorID()).to.equal(2);
    //     });
    //
    //     it('Should succeed and return delegation', async function () {
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.secondValidator, '0.5')
    //         ).to.be.fulfilled;
    //
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.secondValidator, '0.1')
    //         ).to.be.fulfilled;
    //     });
    //
    //     it('Should revert when staking to non-existing validator', async function () {
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.secondValidator, '0.1')
    //         ).to.be.revertedWith("validator doesn't exist");
    //     });
    //
    //     it('Should succeed and stake with different delegators', async function () {
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.validator, '0.5')
    //         ).to.be.fulfilled;
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.validator, '0.1')
    //         ).to.be.fulfilled;
    //
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.secondValidator, '0.5')
    //         ).to.be.fulfilled;
    //         await expect(
    //             this.callLibMethod("delegate", [2], this.secondValidator, '0.3')
    //         ).to.be.fulfilled;
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.validator, '0.2')
    //         ).to.be.fulfilled;
    //     });
    //
    //     it('Should succeed and return the amount of delegated for each Delegator', async function () {
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.validator, '0.5')
    //         ).to.be.fulfilled;
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.validator, '0.1')
    //         ).to.be.fulfilled;
    //         expect(await this.sfc.getStake(this.validator, await this.sfc.getValidatorID(this.validator)))
    //             .to.equal(ethers.parseEther('0.6'));
    //
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.secondValidator, '0.5')
    //         ).to.be.fulfilled;
    //         await expect(
    //             this.callLibMethod("delegate", [2], this.secondValidator, '0.3')
    //         ).to.be.fulfilled;
    //         expect(await this.sfc.getStake(this.secondValidator, await this.sfc.getValidatorID(this.secondValidator)))
    //             .to.equal(ethers.parseEther('0.8'));
    //
    //         await expect(
    //             this.callLibMethod("delegate", [2], this.validator, '0.1')
    //         ).to.be.fulfilled;
    //         expect(await this.sfc.getStake(this.validator, await this.sfc.getValidatorID(this.secondValidator)))
    //             .to.equal(ethers.parseEther('0.1'));
    //     });
    //
    //     it('Should succeed and return the total of received Stake', async function () {
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.validator, '0.5')
    //         ).to.be.fulfilled;
    //
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.validator, '0.1')
    //         ).to.be.fulfilled;
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.secondValidator, '0.2')
    //         ).to.be.fulfilled;
    //
    //         const validator = await this.sfc.getValidator(1);
    //         expect(validator.receivedStake).to.equal(ethers.parseEther('0.8'));
    //     });
    // });
    //
    // describe('Ownable', () => {
    //     it('Should succeed and return the owner of the contract', async function () {
    //         expect(await this.sfc.owner()).to.equal(this.owner);
    //     });
    //
    //     it('Should succeed and return true if the caller is the owner of the contract', async function () {
    //         expect(await this.sfc.isOwner()).to.be.true;
    //         expect(await this.sfc.connect(this.user).isOwner()).to.be.false;
    //     });
    //
    //     it('Should succeed and return address(0) if owner leaves the contract without owner', async function () {
    //         expect(await this.sfc.owner()).to.equal(this.owner);
    //         await expect(this.sfc.renounceOwnership()).to.be.fulfilled;
    //         expect(await this.sfc.owner()).to.equal(ethers.ZeroAddress);
    //     });
    //
    //     it('Should succeed and transfer ownership to the new owner', async function () {
    //         expect(await this.sfc.owner()).to.equal(this.owner);
    //         await expect(this.sfc.transferOwnership(this.user)).to.be.fulfilled;
    //         expect(await this.sfc.owner()).to.equal(this.user);
    //     });
    //
    //     it('Should revert when transferring ownership if not owner', async function () {
    //         await expect(this.sfc.connect(this.user).transferOwnership(ethers.ZeroAddress))
    //             .to.be.revertedWith('Ownable: caller is not the owner');
    //     });
    //
    //     it('Should revert when transferring ownership to zero address', async function () {
    //         await expect(this.sfc.transferOwnership(ethers.ZeroAddress))
    //             .to.be.revertedWith('Ownable: new owner is the zero address');
    //     });
    // });
    //
    // describe('Events emitter', () => {
    //     it('Should succeed and call updateNetworkRules', async function () {
    //         await expect(this.nodeDriverAuth.updateNetworkRules('0x7b22446167223a7b224d6178506172656e7473223a357d2c2245636f6e6f6d79223a7b22426c6f636b4d6973736564536c61636b223a377d2c22426c6f636b73223a7b22426c6f636b476173486172644c696d6974223a313030307d7d'))
    //             .to.be.fulfilled;
    //     });
    //
    //     it('Should succeed and call updateOfflinePenaltyThreshold', async function () {
    //         await expect(this.constants.updateOfflinePenaltyThresholdTime(86_400)).to.be.fulfilled;
    //         await expect(this.constants.updateOfflinePenaltyThresholdBlocksNum(1_000)).to.be.fulfilled;
    //     });
    // });
    //
    // describe('Prevent Genesis Call if not node', () => {
    //     it('Should revert when setGenesisValidator is not called not node', async function () {
    //         const validator = ethers.Wallet.createRandom();
    //         await expect(
    //             this.callLibMethod(
    //                 "setGenesisValidator",
    //                 [validator.address, 1, validator.publicKey, 0, await this.sfc.currentEpoch(), Date.now(), 0, 0]
    //             )
    //         ).to.be.revertedWith('caller is not the NodeDriverAuth contract');
    //     });
    //
    //     it('Should revert when setGenesisDelegation is not called not node', async function () {
    //         const delegator = ethers.Wallet.createRandom();
    //         await expect(
    //             this.callLibMethod(
    //                 "setGenesisDelegation",
    //                 [delegator.address, 1, 100, 0, 0, 0, 0, 0, 1000]
    //             )
    //         ).to.be.revertedWith('caller is not the NodeDriverAuth contract');
    //     });
    // });
    //
    // describe('Validator', () => {
    //     const validatorsFixture = async function (this: any) {
    //         const [ validator, delegator, secondDelegator, thirdDelegator ] = await ethers.getSigners();
    //
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], this.validator, '10')
    //         ).to.be.fulfilled;
    //
    //
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.delegator, '11')
    //         ).to.be.fulfilled;
    //
    //
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.secondDelegator, '8')
    //         ).to.be.fulfilled;
    //
    //         await expect(
    //             this.callLibMethod("delegate", [1], this.thirdDelegator, '8')
    //         ).to.be.fulfilled;
    //
    //         const validatorStruct = await this.sfc.getValidator(1);
    //
    //         return {
    //             validator,
    //             validatorStruct,
    //             delegator,
    //             secondDelegator,
    //             thirdDelegator
    //         }
    //     }
    //
    //     beforeEach(async function () {
    //         return Object.assign(this, await loadFixture(validatorsFixture.bind(this)));
    //     });
    //
    //     describe('Returns Validator', () => {
    //         it('Should succeed and return validator status', async function () {
    //             expect(this.validatorStruct.status).to.equal(0);
    //         });
    //
    //         it('Should succeed and return validator deactivated time', async function () {
    //             expect(this.validatorStruct.deactivatedTime).to.equal(0);
    //         });
    //
    //         it('Should succeed and return validator deactivated Epoch', async function () {
    //             expect(this.validatorStruct.deactivatedEpoch).to.equal(0);
    //         });
    //
    //         it('Should succeed and return validator Received Stake', async function () {
    //             expect(this.validatorStruct.receivedStake).to.equal(ethers.parseEther('37'));
    //         });
    //
    //         it('Should succeed and return validator Created Epoch', async function () {
    //             expect(this.validatorStruct.createdEpoch).to.equal(1);
    //         });
    //
    //         it('Should succeed and return validator Created Time', async function () {
    //             const block = await ethers.provider.getBlock('latest');
    //             expect(block).to.not.be.null;
    //             expect(this.validatorStruct.createdTime).to.be.within(block!.timestamp - 5, block!.timestamp + 5);
    //         });
    //
    //         it('Should succeed and return validator Auth (address)', async function () {
    //             expect(this.validatorStruct.auth).to.equal(this.validator.address);
    //         });
    //     });
    //
    //     describe('EpochSnapshot', () => {
    //         it('Should succeed and return stashedRewardsUntilEpoch', async function () {
    //             expect(await this.sfc.currentEpoch.call()).to.equal(1);
    //             expect(await this.sfc.currentSealedEpoch()).to.equal(0);
    //             await expect(this.sfc.enableNonNodeCalls()).to.be.fulfilled;
    //             await expect(this.sfc.sealEpoch([100, 101, 102], [100, 101, 102], [100, 101, 102], [100, 101, 102], 0))
    //                 .to.be.fulfilled;
    //             expect(await this.sfc.currentEpoch.call()).to.equal(2);
    //             expect(await this.sfc.currentSealedEpoch()).to.equal(1);
    //             for (let i = 0; i < 4; i++) {
    //                 await expect(this.sfc.sealEpoch([100, 101, 102], [100, 101, 102], [100, 101, 102], [100, 101, 102], 0))
    //                     .to.be.fulfilled;
    //             }
    //             expect(await this.sfc.currentEpoch.call()).to.equal(6);
    //             expect(await this.sfc.currentSealedEpoch()).to.equal(5);
    //         });
    //     });
    // });
    //
    // describe('Methods tests', () => {
    //     it('Should succeed and check createValidator function', async function () {
    //         const node = new BlockchainNode(this.sfc);
    //         const [validator, secondValidator] = await ethers.getSigners();
    //         const pubkey = ethers.Wallet.createRandom().publicKey;
    //         const secondPubkey = ethers.Wallet.createRandom().publicKey;
    //         await this.sfc.enableNonNodeCalls();
    //
    //         expect(await this.sfc.lastValidatorID()).to.equal(0);
    //
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], validator, '0.1')
    //         ).to.be.revertedWith('insufficient self-stake');
    //
    //
    //         await expect(
    //             node.handleTx(
    //                 await this.callLibMethod("createValidator", [pubkey], validator, '0.3175')
    //             )
    //         ).to.be.fulfilled;
    //
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], validator, '0.5')
    //         ).to.be.revertedWith('validator already exists');
    //
    //         await expect(
    //             node.handleTx(
    //                 await this.callLibMethod("createValidator", [secondPubkey], secondValidator, '0.5')
    //             )
    //         ).to.be.fulfilled;
    //
    //         expect(await this.sfc.lastValidatorID()).to.equal(2);
    //         expect(await this.sfc.totalStake()).to.equal(ethers.parseEther('0.8175'));
    //
    //         const firstValidatorID = await this.sfc.getValidatorID(validator);
    //         const secondValidatorID = await this.sfc.getValidatorID(secondValidator);
    //         expect(firstValidatorID).to.equal(1);
    //         expect(secondValidatorID).to.equal(2);
    //
    //         expect(await this.sfc.getValidatorPubkey(firstValidatorID)).to.equal(pubkey);
    //         expect(await this.sfc.getValidatorPubkey(secondValidatorID)).to.equal(secondPubkey);
    //
    //         const firstValidatorObj = await this.sfc.getValidator(firstValidatorID);
    //         const secondValidatorObj = await this.sfc.getValidator(secondValidatorID);
    //
    //         // check first validator object
    //         expect(firstValidatorObj.receivedStake).to.equal(ethers.parseEther('0.3175'));
    //         expect(firstValidatorObj.createdEpoch).to.equal(1);
    //         expect(firstValidatorObj.auth).to.equal(validator.address);
    //         expect(firstValidatorObj.status).to.equal(0);
    //         expect(firstValidatorObj.deactivatedTime).to.equal(0);
    //         expect(firstValidatorObj.deactivatedEpoch).to.equal(0);
    //
    //         // check second validator object
    //         expect(secondValidatorObj.receivedStake).to.equal(ethers.parseEther('0.5'));
    //         expect(secondValidatorObj.createdEpoch).to.equal(1);
    //         expect(secondValidatorObj.auth).to.equal(secondValidator.address);
    //         expect(secondValidatorObj.status).to.equal(0);
    //         expect(secondValidatorObj.deactivatedTime).to.equal(0);
    //         expect(secondValidatorObj.deactivatedEpoch).to.equal(0);
    //
    //         // // check created delegations
    //         expect(await this.sfc.getStake(validator, firstValidatorID)).to.equal(ethers.parseEther('0.3175'));
    //         expect(await this.sfc.getStake(secondValidator, secondValidatorID)).to.equal(ethers.parseEther('0.5'));
    //
    //         // check fired node-related logs
    //         expect(node.nextValidatorWeights.size).to.equal(2);
    //         expect(node.nextValidatorWeights.get(firstValidatorID)).to.equal(ethers.parseEther('0.3175'));
    //         expect(node.nextValidatorWeights.get(secondValidatorID)).to.equal(ethers.parseEther('0.5'));
    //     });
    //
    //     it('Should succeed and check sealing epoch', async function () {
    //         const node = new BlockchainNode(this.sfc);
    //         const [validator, secondValidator, thirdValidator] = await ethers.getSigners();
    //         await this.sfc.enableNonNodeCalls();
    //
    //         await expect(
    //             node.handleTx(
    //                 await this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], validator, '0.3175')
    //             )
    //         ).to.be.fulfilled;
    //
    //         await expect(
    //             node.handleTx(
    //                 await this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], secondValidator, '0.6825')
    //             )
    //         ).to.be.fulfilled;
    //
    //         await node.sealEpoch(100);
    //
    //         const firstValidatorID = await this.sfc.getValidatorID(validator);
    //         const secondValidatorID = await this.sfc.getValidatorID(secondValidator);
    //         expect(firstValidatorID).to.equal(1);
    //         expect(secondValidatorID).to.equal(2);
    //
    //         await expect(
    //             node.handleTx(
    //                 await this.callLibMethod("delegate", [1], validator, '0.1')
    //             )
    //         ).to.be.fulfilled;
    //
    //
    //         await expect(
    //             node.handleTx(
    //                 await this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], thirdValidator, '0.4')
    //             )
    //         ).to.be.fulfilled;
    //         const thirdValidatorID = await this.sfc.getValidatorID(thirdValidator);
    //
    //         // check fired node-related logs
    //         expect(node.validatorWeights.size).to.equal(2);
    //         expect(node.validatorWeights.get(firstValidatorID)).to.equal(ethers.parseEther('0.3175'));
    //         expect(node.validatorWeights.get(secondValidatorID)).to.equal(ethers.parseEther('0.6825'));
    //         expect(node.nextValidatorWeights.size).to.equal(3);
    //         expect(node.nextValidatorWeights.get(firstValidatorID)).to.equal(ethers.parseEther('0.4175'));
    //         expect(node.nextValidatorWeights.get(secondValidatorID)).to.equal(ethers.parseEther('0.6825'));
    //         expect(node.nextValidatorWeights.get(thirdValidatorID)).to.equal(ethers.parseEther('0.4'));
    //     });
    //
    //     it('Should succeed and balance gas price', async function () {
    //         const [validator] = await ethers.getSigners();
    //         await this.sfc.enableNonNodeCalls();
    //
    //         await expect(this.constants.updateGasPriceBalancingCounterweight(24 * 60 * 60)).to.be.fulfilled;
    //         await expect(this.sfc.rebaseTime()).to.be.fulfilled;
    //
    //         await expect(
    //             this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], validator, '1')
    //         ).to.be.fulfilled;
    //
    //
    //         await expect(this.constants.updateTargetGasPowerPerSecond(1000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 1_000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //
    //         expect(await this.sfc.minGasPrice()).to.equal(95_000_000_000);
    //
    //         await this.sfc.advanceTime(1);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 1_000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(94_999_998_901);
    //
    //         await this.sfc.advanceTime(2);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 2_000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(94_999_997_802);
    //
    //         await this.sfc.advanceTime(1_000);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 1_000_000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(94_999_996_715);
    //
    //         await this.sfc.advanceTime(1_000);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 666_666)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(94_637_676_437);
    //
    //         await this.sfc.advanceTime(1_000);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 1_500_000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(95_179_080_284);
    //
    //         await this.sfc.advanceTime(1);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 666)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(95_178_711_617);
    //
    //         await this.sfc.advanceTime(1);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 1_500)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(95_179_260_762);
    //
    //         await this.sfc.advanceTime(1_000);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 10_000_000_000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(99_938_223_800);
    //
    //         await this.sfc.advanceTime(10_000);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 0)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(94_941_312_610);
    //
    //         await this.sfc.advanceTime(100);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 200_000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(95_051_069_157);
    //
    //         await this.sfc.advanceTime(100);
    //         await expect(this.sfc.sealEpoch([1], [1], [1], [1], 50_000)).to.be.fulfilled;
    //         await expect(this.sfc.sealEpochValidators([1])).to.be.fulfilled;
    //         expect(await this.sfc.minGasPrice()).to.equal(94_996_125_793);
    //     });
    // });

    describe('Staking / Sealed Epoch functions', () => {
        const validatorsFixture = async function (this: any) {
            const [ validator, secondValidator, thirdValidator, delegator, secondDelegator ] = await ethers.getSigners();
            const blockchainNode = new BlockchainNode(this.sfc);

            await expect(this.sfc.rebaseTime()).to.be.fulfilled;
            await expect(this.sfc.enableNonNodeCalls()).to.be.fulfilled;

            await expect(blockchainNode.handleTx(
                    await this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], validator, '0.4')
            )).to.be.fulfilled;

            await expect(blockchainNode.handleTx(
                await this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], secondValidator, '0.8')
            )).to.be.fulfilled;

            await expect(blockchainNode.handleTx(
                await this.callLibMethod("createValidator", [ethers.Wallet.createRandom().publicKey], thirdValidator, '0.8')
            )).to.be.fulfilled;

            await expect(blockchainNode.handleTx(
                await this.callLibMethod("delegate", [1], validator, '0.4')
            )).to.be.fulfilled;

            await expect(blockchainNode.handleTx(
                await this.callLibMethod("delegate", [1], delegator, '0.4')
            )).to.be.fulfilled;

            await expect(blockchainNode.handleTx(
                await this.callLibMethod("delegate", [2], secondDelegator, '0.4')
            )).to.be.fulfilled;

            await expect(blockchainNode.sealEpoch(0)).to.be.fulfilled;

            return {
                validator,
                secondValidator,
                thirdValidator,
                delegator,
                secondDelegator,
                blockchainNode
            }
        }

        beforeEach(async function () {
            return Object.assign(this, await loadFixture(validatorsFixture.bind(this)));
        });

        it('Should succeed and return claimed Rewards until Epoch', async function () {
            await expect(this.constants.updateBaseRewardPerSecond(1)).to.be.fulfilled;
            await expect(this.blockchainNode.sealEpoch(60 * 60 * 24)).to.be.fulfilled;
            await expect(this.blockchainNode.sealEpoch(60 * 60 * 24)).to.be.fulfilled;
            expect(await this.sfc.stashedRewardsUntilEpoch(this.delegator, 1)).to.equal(0);
            await expect(this.callLibMethod("claimRewards", [1], this.delegator)).to.be.fulfilled;
            expect(await this.sfc.stashedRewardsUntilEpoch(this.delegator, 1)).to.equal(await this.sfc.currentSealedEpoch());
        });

        it('Should succeed and check pending rewards of delegators', async function () {
            await expect(this.constants.updateBaseRewardPerSecond(1)).to.be.fulfilled;
            expect(await this.readLibData("pendingRewards", [this.validator.address, 1])).to.equal(0);
            expect(await this.readLibData("pendingRewards", [this.delegator.address, 1])).to.equal(0);
            await expect(this.blockchainNode.sealEpoch(60 * 60 * 24)).to.be.fulfilled;
            expect(await this.readLibData("pendingRewards", [this.validator.address, 1])).to.equal(6_966);
            expect(await this.readLibData("pendingRewards", [this.delegator.address, 1])).to.equal(2_754);
        });

        it('Should succeed and check if pending rewards have been increased after sealing epoch', async function () {
            await expect(this.constants.updateBaseRewardPerSecond(1)).to.be.fulfilled;
            await expect(this.blockchainNode.sealEpoch(60 * 60 * 24)).to.be.fulfilled;
            expect(await this.readLibData("pendingRewards", [this.validator.address, 1])).to.equal(6_966);
            expect(await this.readLibData("pendingRewards", [this.delegator.address, 1])).to.equal(2_754);
            await expect(this.blockchainNode.sealEpoch(60 * 60 * 24)).to.be.fulfilled;
            expect(await this.readLibData("pendingRewards", [this.validator.address, 1])).to.equal(13_932);
            expect(await this.readLibData("pendingRewards", [this.delegator.address, 1])).to.equal(5_508);
        });

        it('Should succeed and increase balances after claiming rewards', async function () {
            await expect(this.constants.updateBaseRewardPerSecond(100_000_000_000_000)).to.be.fulfilled;
            await expect(this.blockchainNode.sealEpoch(0)).to.be.fulfilled;
            await expect(this.blockchainNode.sealEpoch(60 * 60 * 24)).to.be.fulfilled;
            const delegatorPendingRewards = await this.readLibData("pendingRewards", [this.delegator.address, 1])
            expect(delegatorPendingRewards).to.be.equal(ethers.parseEther('0.2754'));
            const delegatorBalance = await ethers.provider.getBalance(this.delegator.address);
            await expect(this.callLibMethod("claimRewards", [1], this.delegator)).to.be.fulfilled;
            const delegatorNewBalance = await ethers.provider.getBalance(this.delegator.address);
            expect(delegatorBalance + delegatorPendingRewards).to.be.above(delegatorNewBalance);
            expect(delegatorBalance + delegatorPendingRewards).to.be.below(delegatorNewBalance + ethers.parseEther('0.01'));
        });

        it('Should succeed and increase stake after restaking rewards', async function () {
            await expect(this.constants.updateBaseRewardPerSecond(1)).to.be.fulfilled;
            await expect(this.blockchainNode.sealEpoch(0)).to.be.fulfilled;
            await expect(this.blockchainNode.sealEpoch(60 * 60 * 24)).to.be.fulfilled;
            const delegatorPendingRewards = await this.readLibData("pendingRewards", [this.delegator.address, 1])
            expect(delegatorPendingRewards).to.be.equal(2754);
            const delegatorStake = await this.sfc.getStake(this.delegator, 1);
            const delegatorLockupInfo = await this.sfc.getLockupInfo(this.delegator, 1);
            await expect(this.callLibMethod("restakeRewards", [1], this.delegator)).to.be.fulfilled;
            const delegatorNewStake = await this.sfc.getStake(this.delegator, 1);
            const delegatorNewLockupInfo = await this.sfc.getLockupInfo(this.delegator, 1);
            expect(delegatorNewStake).to.equal(delegatorStake + delegatorPendingRewards);
            expect(delegatorNewLockupInfo.lockedStake).to.equal(delegatorLockupInfo.lockedStake);
        });
    });
});


// contract('SFC', async ([firstValidator, secondValidator, thirdValidator, testValidator, firstDelegator, secondDelegator, account1, account2, account3, account4]) => {
//     let firstValidatorID;
//     let secondValidatorID;
//     let thirdValidatorID;
//
//     beforeEach(async () => {
//         this.sfc = await SFCI.at((await UnitTestSFC.new()).address);
//         const nodeIRaw = await NodeDriver.new();
//         const evmWriter = await StubEvmWriter.new();
//         this.nodeI = await NodeDriverAuth.new();
//         this.sfcLib = await UnitTestSFCLib.new();
//         const initializer = await NetworkInitializer.new();
//         await initializer.initializeAll(0, 0, this.sfc.address, this.sfcLib.address, this.nodeI.address, nodeIRaw.address, evmWriter.address, firstValidator);
//         this.consts = await ConstantsManager.at(await this.sfc.constsAddress.call());
//         await this.sfc.rebaseTime();
//         await this.sfc.enableNonNodeCalls();
//
//         await this.sfc.createValidator(pubkey, {
//             from: firstValidator,
//             value: amount18('0.4'),
//         });
//         firstValidatorID = await this.sfc.getValidatorID(firstValidator);
//
//         await this.sfc.createValidator(pubkey1, {
//             from: secondValidator,
//             value: amount18('0.8'),
//         });
//         secondValidatorID = await this.sfc.getValidatorID(secondValidator);
//
//         await this.sfc.createValidator(pubkey2, {
//             from: thirdValidator,
//             value: amount18('0.8'),
//         });
//         thirdValidatorID = await this.sfc.getValidatorID(thirdValidator);
//         await this.sfc.delegate(firstValidatorID, {
//             from: firstValidator,
//             value: amount18('0.4'),
//         });
//
//         await this.sfc.delegate(firstValidatorID, {
//             from: firstDelegator,
//             value: amount18('0.4'),
//         });
//         await this.sfc.delegate(secondValidatorID, {
//             from: secondDelegator,
//             value: amount18('0.4'),
//         });
//
//         await sealEpoch(this.sfc, (new BN(0)).toString());
//     });
//
//     describe('Staking / Sealed Epoch functions', () => {

//         it('Should increase locked stake after restaking Rewards', async () => {
//             await this.sfc.lockStake(firstValidatorID, new BN(86400 * 219 + 10), amount18('0.2'), {
//                 from: firstValidator,
//             });
//             await this.sfc.lockStake(firstValidatorID, new BN(86400 * 219), amount18('0.2'), {
//                 from: firstDelegator,
//             });
//
//             await this.consts.updateBaseRewardPerSecond(new BN('1'));
//
//             await sealEpoch(this.sfc, (new BN(0)).toString());
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//
//             const firstDelegatorPendingRewards = await this.sfc.pendingRewards(firstDelegator, firstValidatorID);
//             expect(firstDelegatorPendingRewards).to.be.bignumber.equal(new BN('4681'));
//             const firstDelegatorPendingLockupRewards = new BN('3304');
//             const firstDelegatorStake = await this.sfc.getStake(firstDelegator, firstValidatorID);
//             const firstDelegatorLockupInfo = await this.sfc.getLockupInfo(firstDelegator, firstValidatorID);
//
//             await this.sfc.restakeRewards(1, { from: firstDelegator });
//
//             const delegatorStake = await this.sfc.getStake(firstDelegator, firstValidatorID);
//             const delegatorLockupInfo = await this.sfc.getLockupInfo(firstDelegator, firstValidatorID);
//             expect(delegatorStake).to.be.bignumber.equal(firstDelegatorStake.add(firstDelegatorPendingRewards));
//             expect(delegatorLockupInfo.lockedStake).to.be.bignumber.equal(firstDelegatorLockupInfo.lockedStake.add(firstDelegatorPendingLockupRewards));
//         });
//
//         it('Should return stashed Rewards', async () => {
//             await this.consts.updateBaseRewardPerSecond(new BN('1'));
//
//             await sealEpoch(this.sfc, (new BN(0)).toString());
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//
//             expect((await this.sfc.rewardsStash(firstDelegator, 1)).toString()).to.equals('0');
//
//             await this.sfc.stashRewards(firstDelegator, 1);
//             expect((await this.sfc.rewardsStash(firstDelegator, 1)).toString()).to.equals('2754');
//         });
//
//         it('Should update the validator on node', async () => {
//             await this.consts.updateOfflinePenaltyThresholdTime(10000);
//             await this.consts.updateOfflinePenaltyThresholdBlocksNum(500);
//
//             expect(await this.consts.offlinePenaltyThresholdTime()).to.bignumber.equals(new BN(10000));
//             expect(await this.consts.offlinePenaltyThresholdBlocksNum()).to.bignumber.equals(new BN(500));
//         });
//
//         it('Should not be able to deactivate validator if not Node', async () => {
//             await this.sfc.disableNonNodeCalls();
//             await expect(this.sfc.deactivateValidator(1, 0)).to.be.revertedWith('caller is not the NodeDriverAuth contract');
//         });
//
//         it('Should seal Epochs', async () => {
//             let validatorsMetrics;
//             const validatorIDs = (await this.sfc.lastValidatorID()).toNumber();
//
//             if (validatorsMetrics === undefined) {
//                 validatorsMetrics = {};
//                 for (let i = 0; i < validatorIDs; i++) {
//                     validatorsMetrics[i] = {
//                         offlineTime: new BN('0'),
//                         offlineBlocks: new BN('0'),
//                         uptime: new BN(24 * 60 * 60).toString(),
//                         originatedTxsFee: amount18('100'),
//                     };
//                 }
//             }
//             const allValidators = [];
//             const offlineTimes = [];
//             const offlineBlocks = [];
//             const uptimes = [];
//             const originatedTxsFees = [];
//             for (let i = 0; i < validatorIDs; i++) {
//                 allValidators.push(i + 1);
//                 offlineTimes.push(validatorsMetrics[i].offlineTime);
//                 offlineBlocks.push(validatorsMetrics[i].offlineBlocks);
//                 uptimes.push(validatorsMetrics[i].uptime);
//                 originatedTxsFees.push(validatorsMetrics[i].originatedTxsFee);
//             }
//
//             await expect(this.sfc.advanceTime(new BN(24 * 60 * 60).toString())).to.be.fulfilled;
//             await expect(this.sfc.sealEpoch(offlineTimes, offlineBlocks, uptimes, originatedTxsFees, 0)).to.be.fulfilled;
//             await expect(this.sfc.sealEpochValidators(allValidators)).to.be.fulfilled;
//         });
//
//         it('Should seal Epoch on Validators', async () => {
//             let validatorsMetrics;
//             const validatorIDs = (await this.sfc.lastValidatorID()).toNumber();
//
//             if (validatorsMetrics === undefined) {
//                 validatorsMetrics = {};
//                 for (let i = 0; i < validatorIDs; i++) {
//                     validatorsMetrics[i] = {
//                         offlineTime: new BN('0'),
//                         offlineBlocks: new BN('0'),
//                         uptime: new BN(24 * 60 * 60).toString(),
//                         originatedTxsFee: amount18('0'),
//                     };
//                 }
//             }
//             const allValidators = [];
//             const offlineTimes = [];
//             const offlineBlocks = [];
//             const uptimes = [];
//             const originatedTxsFees = [];
//             for (let i = 0; i < validatorIDs; i++) {
//                 allValidators.push(i + 1);
//                 offlineTimes.push(validatorsMetrics[i].offlineTime);
//                 offlineBlocks.push(validatorsMetrics[i].offlineBlocks);
//                 uptimes.push(validatorsMetrics[i].uptime);
//                 originatedTxsFees.push(validatorsMetrics[i].originatedTxsFee);
//             }
//
//             await expect(this.sfc.advanceTime(new BN(24 * 60 * 60).toString())).to.be.fulfilled;
//             await expect(this.sfc.sealEpoch(offlineTimes, offlineBlocks, uptimes, originatedTxsFees, 0)).to.be.fulfilled;
//             await expect(this.sfc.sealEpochValidators(allValidators)).to.be.fulfilled;
//         });
//     });
//
//     describe('Stake lockup', () => {
//         beforeEach('lock stakes', async () => {
//             // Lock 75% of stake for 60% of a maximum lockup period
//             // Should receive (0.3 * 0.25 + (0.3 + 0.7 * 0.6) * 0.75) / 0.3 = 2.05 times more rewards
//             await this.sfc.lockStake(firstValidatorID, new BN(86400 * 219), amount18('0.6'), {
//                 from: firstValidator,
//             });
//             // Lock 25% of stake for 20% of a maximum lockup period
//             // Should receive (0.3 * 0.75 + (0.3 + 0.7 * 0.2) * 0.25) / 0.3 = 1.1166 times more rewards
//             await this.sfc.lockStake(firstValidatorID, new BN(86400 * 73), amount18('0.1'), {
//                 from: firstDelegator,
//             });
//         });
//
//         // note: copied from the non-lockup tests
//         it('Check pending Rewards of delegators', async () => {
//             await this.consts.updateBaseRewardPerSecond(new BN('1'));
//
//             expect((await this.sfc.pendingRewards(firstValidator, firstValidatorID)).toString()).to.equals('0');
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString()).to.equals('0');
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//
//             expect((await this.sfc.pendingRewards(firstValidator, firstValidatorID)).toString()).to.equals('14279');
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString()).to.equals('3074');
//         });
//
//         // note: copied from the non-lockup tests
//         it('Check if pending Rewards have been increased after sealing Epoch', async () => {
//             await this.consts.updateBaseRewardPerSecond(new BN('1'));
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             expect((await this.sfc.pendingRewards(firstValidator, firstValidatorID)).toString()).to.equals('14279');
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString()).to.equals('3074');
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             expect((await this.sfc.pendingRewards(firstValidator, firstValidatorID)).toString()).to.equals('28558');
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString()).to.equals('6150');
//         });
//
//         // note: copied from the non-lockup tests
//         it('Should increase balances after claiming Rewards', async () => {
//             await this.consts.updateBaseRewardPerSecond(new BN('1'));
//
//             await sealEpoch(this.sfc, (new BN(0)).toString());
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//
//             const firstDelegatorPendingRewards = await this.sfc.pendingRewards(firstDelegator, firstValidatorID);
//             const firstDelegatorBalance = await web3.eth.getBalance(firstDelegator);
//
//             await this.sfc.claimRewards(1, { from: firstDelegator });
//
//             expect(new BN(firstDelegatorBalance + firstDelegatorPendingRewards)).to.be.bignumber.above(await web3.eth.getBalance(firstDelegator));
//         });
//
//         // note: copied from the non-lockup tests
//         it('Should return stashed Rewards', async () => {
//             await this.consts.updateBaseRewardPerSecond(new BN('1'));
//
//             await sealEpoch(this.sfc, (new BN(0)).toString());
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//
//             expect((await this.sfc.rewardsStash(firstDelegator, 1)).toString()).to.equals('0');
//
//             await this.sfc.stashRewards(firstDelegator, 1);
//             expect((await this.sfc.rewardsStash(firstDelegator, 1)).toString()).to.equals('3074');
//         });
//
//         it('Should return pending rewards after unlocking and re-locking', async () => {
//             await this.consts.updateBaseRewardPerSecond(new BN('1'));
//
//             for (let i = 0; i < 2; i++) {
//                 const epoch = await this.sfc.currentSealedEpoch();
//                 // delegator 1 is still locked
//                 // delegator 1 should receive more rewards than delegator 2
//                 // validator 1 should receive more rewards than validator 2
//                 await sealEpoch(this.sfc, (new BN(86400 * (73))).toString());
//
//                 expect(await this.sfc.pendingRewards(firstDelegator, 1)).to.be.bignumber.equal(new BN(224496));
//                 expect(await this.sfc.pendingRewards(secondDelegator, 2)).to.be.bignumber.equal(new BN(201042));
//                 expect(await this.sfc.pendingRewards(firstValidator, 1)).to.be.bignumber.equal(new BN(1042461));
//                 expect(await this.sfc.pendingRewards(secondValidator, 2)).to.be.bignumber.equal(new BN(508518));
//
//                 expect(await this.sfc.highestLockupEpoch(firstDelegator, 1)).to.be.bignumber.equal(epoch.add(new BN(1)));
//                 expect(await this.sfc.highestLockupEpoch(secondDelegator, 2)).to.be.bignumber.equal(new BN(0));
//                 expect(await this.sfc.highestLockupEpoch(firstValidator, 1)).to.be.bignumber.equal(epoch.add(new BN(1)));
//                 expect(await this.sfc.highestLockupEpoch(secondValidator, 2)).to.be.bignumber.equal(new BN(0));
//
//                 // delegator 1 isn't locked already
//                 // delegator 1 should receive the same reward as delegator 2
//                 // validator 1 should receive more rewards than validator 2
//                 await sealEpoch(this.sfc, (new BN(86400 * (1))).toString());
//
//                 expect(await this.sfc.pendingRewards(firstDelegator, 1)).to.be.bignumber.equal(new BN(224496 + 2754));
//                 expect(await this.sfc.pendingRewards(secondDelegator, 2)).to.be.bignumber.equal(new BN(201042 + 2754));
//                 expect(await this.sfc.pendingRewards(firstValidator, 1)).to.be.bignumber.equal(new BN(1042461 + 14279));
//                 expect(await this.sfc.pendingRewards(secondValidator, 2)).to.be.bignumber.equal(new BN(508518 + 6966));
//                 expect(await this.sfc.highestLockupEpoch(firstDelegator, 1)).to.be.bignumber.equal(epoch.add(new BN(1)));
//                 expect(await this.sfc.highestLockupEpoch(firstValidator, 1)).to.be.bignumber.equal(epoch.add(new BN(2)));
//
//                 // validator 1 is still locked
//                 // delegator 1 should receive the same reward as delegator 2
//                 // validator 1 should receive more rewards than validator 2
//                 await sealEpoch(this.sfc, (new BN(86400 * (145))).toString());
//
//                 expect(await this.sfc.pendingRewards(firstDelegator, 1)).to.be.bignumber.equal(new BN(224496 + 2754 + 399330));
//                 expect(await this.sfc.pendingRewards(secondDelegator, 2)).to.be.bignumber.equal(new BN(201042 + 2754 + 399330));
//                 expect(await this.sfc.pendingRewards(firstValidator, 1)).to.be.bignumber.equal(new BN(1042461 + 14279 + 2070643));
//                 expect(await this.sfc.pendingRewards(secondValidator, 2)).to.be.bignumber.equal(new BN(508518 + 6966 + 1010070));
//                 expect(await this.sfc.highestLockupEpoch(firstDelegator, 1)).to.be.bignumber.equal(epoch.add(new BN(1)));
//                 expect(await this.sfc.highestLockupEpoch(firstValidator, 1)).to.be.bignumber.equal(epoch.add(new BN(3)));
//
//                 // validator 1 isn't locked already
//                 // delegator 1 should receive the same reward as delegator 2
//                 // validator 1 should receive the same reward as validator 2
//                 await sealEpoch(this.sfc, (new BN(86400 * (1))).toString());
//
//                 expect(await this.sfc.pendingRewards(firstDelegator, 1)).to.be.bignumber.equal(new BN(224496 + 2754 + 399330 + 2754));
//                 expect(await this.sfc.pendingRewards(secondDelegator, 2)).to.be.bignumber.equal(new BN(201042 + 2754 + 399330 + 2754));
//                 expect(await this.sfc.pendingRewards(firstValidator, 1)).to.be.bignumber.equal(new BN(1042461 + 14279 + 2070643 + 6966));
//                 expect(await this.sfc.pendingRewards(secondValidator, 2)).to.be.bignumber.equal(new BN(508518 + 6966 + 1010070 + 6966));
//                 expect(await this.sfc.highestLockupEpoch(firstDelegator, 1)).to.be.bignumber.equal(epoch.add(new BN(1)));
//                 expect(await this.sfc.highestLockupEpoch(firstValidator, 1)).to.be.bignumber.equal(epoch.add(new BN(3)));
//
//                 // re-lock both validator and delegator
//                 await this.sfc.lockStake(firstValidatorID, new BN(86400 * 219), amount18('0.6'), {
//                     from: firstValidator,
//                 });
//                 await this.sfc.lockStake(firstValidatorID, new BN(86400 * 73), amount18('0.1'), {
//                     from: firstDelegator,
//                 });
//                 // check rewards didn't change after re-locking
//                 expect(await this.sfc.pendingRewards(firstDelegator, 1)).to.be.bignumber.equal(new BN(224496 + 2754 + 399330 + 2754));
//                 expect(await this.sfc.pendingRewards(secondDelegator, 2)).to.be.bignumber.equal(new BN(201042 + 2754 + 399330 + 2754));
//                 expect(await this.sfc.pendingRewards(firstValidator, 1)).to.be.bignumber.equal(new BN(1042461 + 14279 + 2070643 + 6966));
//                 expect(await this.sfc.pendingRewards(secondValidator, 2)).to.be.bignumber.equal(new BN(508518 + 6966 + 1010070 + 6966));
//                 expect(await this.sfc.highestLockupEpoch(firstDelegator, 1)).to.be.bignumber.equal(new BN(0));
//                 expect(await this.sfc.highestLockupEpoch(firstValidator, 1)).to.be.bignumber.equal(new BN(0));
//                 // claim rewards to reset pending rewards
//                 await this.sfc.claimRewards(1, { from: firstDelegator });
//                 await this.sfc.claimRewards(2, { from: secondDelegator });
//                 await this.sfc.claimRewards(1, { from: firstValidator });
//                 await this.sfc.claimRewards(2, { from: secondValidator });
//             }
//         });
//     });
//
//     describe('NodeDriver', () => {
//         it('Should not be able to call `setGenesisValidator` if not NodeDriver', async () => {
//             await expectRevert(this.nodeI.setGenesisValidator(account1, 1, pubkey, 1 << 3, await this.sfc.currentEpoch(), Date.now(), 0, 0, {
//                 from: account2,
//             }), 'caller is not the NodeDriver contract');
//         });
//
//         it('Should not be able to call `setGenesisDelegation` if not NodeDriver', async () => {
//             await expectRevert(this.nodeI.setGenesisDelegation(firstDelegator, 1, 100, 0, 0, 0, 0, 0, 1000, {
//                 from: account2,
//             }), 'caller is not the NodeDriver contract');
//         });
//
//         it('Should not be able to call `deactivateValidator` if not NodeDriver', async () => {
//             await expectRevert(this.nodeI.deactivateValidator(1, 0, {
//                 from: account2,
//             }), 'caller is not the NodeDriver contract');
//         });
//
//         it('Should not be able to call `deactivateValidator` with wrong status', async () => {
//             await expectRevert(this.sfc.deactivateValidator(1, 0), 'wrong status');
//         });
//
//         it('Should deactivate Validator', async () => {
//             await this.sfc.deactivateValidator(1, 1);
//         });
//
//         it('Should not be able to call `sealEpochValidators` if not NodeDriver', async () => {
//             await expectRevert(this.nodeI.sealEpochValidators([1], {
//                 from: account2,
//             }), 'caller is not the NodeDriver contract');
//         });
//
//         it('Should not be able to call `sealEpoch` if not NodeDriver', async () => {
//             let validatorsMetrics;
//             const validatorIDs = (await this.sfc.lastValidatorID()).toNumber();
//
//             if (validatorsMetrics === undefined) {
//                 validatorsMetrics = {};
//                 for (let i = 0; i < validatorIDs; i++) {
//                     validatorsMetrics[i] = {
//                         offlineTime: new BN('0'),
//                         offlineBlocks: new BN('0'),
//                         uptime: new BN(24 * 60 * 60).toString(),
//                         originatedTxsFee: amount18('0'),
//                     };
//                 }
//             }
//             const allValidators = [];
//             const offlineTimes = [];
//             const offlineBlocks = [];
//             const uptimes = [];
//             const originatedTxsFees = [];
//             for (let i = 0; i < validatorIDs; i++) {
//                 allValidators.push(i + 1);
//                 offlineTimes.push(validatorsMetrics[i].offlineTime);
//                 offlineBlocks.push(validatorsMetrics[i].offlineBlocks);
//                 uptimes.push(validatorsMetrics[i].uptime);
//                 originatedTxsFees.push(validatorsMetrics[i].originatedTxsFee);
//             }
//
//             await expect(this.sfc.advanceTime(new BN(24 * 60 * 60).toString())).to.be.fulfilled;
//             await expectRevert(this.nodeI.sealEpoch(offlineTimes, offlineBlocks, uptimes, originatedTxsFees, 0, {
//                 from: account2,
//             }), 'caller is not the NodeDriver contract');
//         });
//     });
//
//     describe('Epoch getters', () => {
//         it('should return EpochvalidatorIds', async () => {
//             const currentSealedEpoch = await this.sfc.currentSealedEpoch();
//             await this.sfc.getEpochValidatorIDs(currentSealedEpoch);
//         });
//
//         it('should return the Epoch Received Stake', async () => {
//             const currentSealedEpoch = await this.sfc.currentSealedEpoch();
//             await this.sfc.getEpochReceivedStake(currentSealedEpoch, 1);
//         });
//
//         it('should return the Epoch Accumulated Reward Per Token', async () => {
//             const currentSealedEpoch = await this.sfc.currentSealedEpoch();
//             await this.sfc.getEpochAccumulatedRewardPerToken(currentSealedEpoch, 1);
//         });
//
//         it('should return the Epoch Accumulated Uptime', async () => {
//             const currentSealedEpoch = await this.sfc.currentSealedEpoch();
//             await this.sfc.getEpochAccumulatedUptime(currentSealedEpoch, 1);
//         });
//
//         it('should return the Epoch Accumulated Originated Txs Fee', async () => {
//             const currentSealedEpoch = await this.sfc.currentSealedEpoch();
//             await this.sfc.getEpochAccumulatedOriginatedTxsFee(currentSealedEpoch, 1);
//         });
//
//         it('should return the Epoch Offline time ', async () => {
//             const currentSealedEpoch = await this.sfc.currentSealedEpoch();
//             await this.sfc.getEpochOfflineTime(currentSealedEpoch, 1);
//         });
//
//         it('should return Epoch Offline Blocks', async () => {
//             const currentSealedEpoch = await this.sfc.currentSealedEpoch();
//             await this.sfc.getEpochOfflineBlocks(currentSealedEpoch, 1);
//         });
//     });
//
//     describe('Unlock features', () => {
//         it('should fail if trying to unlock stake if not lockedup', async () => {
//             await expectRevert(this.sfc.unlockStake(1, 10), 'not locked up');
//         });
//
//         it('should fail if trying to unlock stake if amount is 0', async () => {
//             await expectRevert(this.sfc.unlockStake(1, 0), 'zero amount');
//         });
//
//         it('should return if slashed', async () => {
//             console.log(await this.sfc.isSlashed(1));
//         });
//
//         it('should fail if delegating to an unexisting validator', async () => {
//             await expectRevert(this.sfc.delegate(4), "validator doesn't exist");
//         });
//
//         it('should fail if delegating to an unexisting validator (2)', async () => {
//             await expectRevert(this.sfc.delegate(4, {
//                 value: 10000,
//             }), "validator doesn't exist");
//         });
//     });
//
//     describe('SFC Rewards getters / Features', () => {
//         it('should return stashed rewards', async () => {
//             console.log(await this.sfc.rewardsStash(firstDelegator, 1));
//         });
//
//         it('should return locked stake', async () => {
//             console.log(await this.sfc.getLockedStake(firstDelegator, 1));
//         });
//
//         it('should return locked stake (2)', async () => {
//             console.log(await this.sfc.getLockedStake(firstDelegator, 2));
//         });
//     });
// });
//
// contract('SFC', async ([firstValidator, firstDelegator]) => {
//     let firstValidatorID;
//
//     beforeEach(async () => {
//         this.sfc = await SFCI.at((await UnitTestSFC.new()).address);
//         const nodeIRaw = await NodeDriver.new();
//         const evmWriter = await StubEvmWriter.new();
//         this.nodeI = await NodeDriverAuth.new();
//         this.sfcLib = await UnitTestSFCLib.new();
//         const initializer = await NetworkInitializer.new();
//         await initializer.initializeAll(0, 0, this.sfc.address, this.sfcLib.address, this.nodeI.address, nodeIRaw.address, evmWriter.address, firstValidator);
//         this.consts = await ConstantsManager.at(await this.sfc.constsAddress.call());
//         await this.sfc.enableNonNodeCalls();
//         await this.sfc.setGenesisValidator(firstValidator, 1, pubkey, 0, await this.sfc.currentEpoch(), Date.now(), 0, 0);
//         firstValidatorID = await this.sfc.getValidatorID(firstValidator);
//         await this.sfc.delegate(firstValidatorID, {
//             from: firstValidator,
//             value: amount18('4'),
//         });
//         await sealEpoch(this.sfc, new BN(24 * 60 * 60));
//     });
//
//     describe('Staking / Sealed Epoch functions', () => {
//         it('Should setGenesisDelegation Validator', async () => {
//             await this.sfc.setGenesisDelegation(firstDelegator, firstValidatorID, amount18('1'), 0, 0, 0, 0, 0, 100);
//             expect(await this.sfc.getStake(firstDelegator, firstValidatorID)).to.bignumber.equals(amount18('1'));
//         });
//     });
// });
//
// contract('SFC', async ([firstValidator, testValidator, firstDelegator, secondDelegator, thirdDelegator, account1, account2, account3]) => {
//     let testValidator1ID;
//     let testValidator2ID;
//     let testValidator3ID;
//
//     beforeEach(async () => {
//         this.sfc = await SFCI.at((await UnitTestSFC.new()).address);
//         const nodeIRaw = await NodeDriver.new();
//         const evmWriter = await StubEvmWriter.new();
//         this.nodeI = await NodeDriverAuth.new();
//         this.sfcLib = await UnitTestSFCLib.new();
//         const initializer = await NetworkInitializer.new();
//         await initializer.initializeAll(0, 0, this.sfc.address, this.sfcLib.address, this.nodeI.address, nodeIRaw.address, evmWriter.address, firstValidator);
//         this.consts = await ConstantsManager.at(await this.sfc.constsAddress.call());
//         await this.sfc.rebaseTime();
//         await this.sfc.enableNonNodeCalls();
//
//         await this.consts.updateBaseRewardPerSecond(amount18('1'));
//
//         await this.sfc.createValidator(pubkey, {
//             from: account1,
//             value: amount18('10'),
//         });
//
//         await this.sfc.createValidator(pubkey1, {
//             from: account2,
//             value: amount18('5'),
//         });
//
//         await this.sfc.createValidator(pubkey2, {
//             from: account3,
//             value: amount18('1'),
//         });
//
//         testValidator1ID = await this.sfc.getValidatorID(account1);
//         testValidator2ID = await this.sfc.getValidatorID(account2);
//         testValidator3ID = await this.sfc.getValidatorID(account3);
//
//         await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 364), amount18('1'),
//             { from: account3 });
//
//         await sealEpoch(this.sfc, (new BN(0)).toString());
//     });
//
//     describe('Test Rewards Calculation', () => {
//         it('Calculation of validators rewards should be equal to 30%', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             const rewardAcc1 = (await this.sfc.pendingRewards(account1, testValidator1ID)).toString().slice(0, -16);
//             const rewardAcc2 = (await this.sfc.pendingRewards(account2, testValidator2ID)).toString().slice(0, -16);
//             const rewardAcc3 = (await this.sfc.pendingRewards(account3, testValidator3ID)).toString().slice(0, -16);
//
//             expect(parseInt(rewardAcc1) + parseInt(rewardAcc2) + parseInt(rewardAcc3)).to.equal(34363);
//         });
//
//         it('Should not be able withdraw if request does not exist', async () => {
//             await expectRevert(this.sfc.withdraw(testValidator1ID, 0), "request doesn't exist");
//         });
//
//         it('Should not be able to undelegate 0 amount', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await expectRevert(this.sfc.undelegate(testValidator1ID, 0, 0), 'zero amount');
//         });
//
//         it('Should not be able to undelegate if not enough unlocked stake', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await expectRevert(this.sfc.undelegate(testValidator1ID, 0, 10), 'not enough unlocked stake');
//         });
//
//         it('Should not be able to unlock if not enough unlocked stake', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator1ID, {
//                 from: thirdDelegator,
//                 value: amount18('1'),
//             });
//             await expectRevert(this.sfc.unlockStake(testValidator1ID, 10, { from: thirdDelegator }), 'not locked up');
//         });
//
//         it('should return the unlocked stake', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('1'),
//             });
//             const unlockedStake = await this.sfc.getUnlockedStake(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//             expect(unlockedStake.toString()).to.equal('1000000000000000000');
//         });
//
//         it('Should not be able to claim Rewards if 0 rewards', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await expectRevert(this.sfc.claimRewards(testValidator1ID, { from: thirdDelegator }), 'zero rewards');
//         });
//     });
// });
//
// contract('SFC', async ([firstValidator, testValidator, firstDelegator, secondDelegator, thirdDelegator, account1, account2, account3]) => {
//     let testValidator1ID;
//     let testValidator2ID;
//     let testValidator3ID;
//
//     beforeEach(async () => {
//         this.sfc = await SFCI.at((await UnitTestSFC.new()).address);
//         const nodeIRaw = await NodeDriver.new();
//         const evmWriter = await StubEvmWriter.new();
//         this.nodeI = await NodeDriverAuth.new();
//         this.sfcLib = await UnitTestSFCLib.new();
//         const initializer = await NetworkInitializer.new();
//         await initializer.initializeAll(0, 0, this.sfc.address, this.sfcLib.address, this.nodeI.address, nodeIRaw.address, evmWriter.address, firstValidator);
//         this.consts = await ConstantsManager.at(await this.sfc.constsAddress.call());
//         await this.sfc.rebaseTime();
//         await this.sfc.enableNonNodeCalls();
//
//         await this.consts.updateBaseRewardPerSecond(amount18('1'));
//
//         await this.sfc.createValidator(pubkey, {
//             from: account1,
//             value: amount18('10'),
//         });
//
//         await this.sfc.createValidator(pubkey1, {
//             from: account2,
//             value: amount18('5'),
//         });
//
//         await this.sfc.createValidator(pubkey2, {
//             from: account3,
//             value: amount18('1'),
//         });
//
//         await sealEpoch(this.sfc, (new BN(0)).toString());
//
//         testValidator1ID = await this.sfc.getValidatorID(account1);
//         testValidator2ID = await this.sfc.getValidatorID(account2);
//         testValidator3ID = await this.sfc.getValidatorID(account3);
//
//         await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * (365 - 31)), amount18('1'),
//             { from: account3 });
//
//         await sealEpoch(this.sfc, (new BN(0)).toString());
//     });
//
//     describe('Test Calculation Rewards with Lockup', () => {
//         it('Should not be able to lock 0 amount', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await expectRevert(this.sfc.lockStake(testValidator1ID, (2 * 60 * 60 * 24 * 365), amount18('0'), {
//                 from: thirdDelegator,
//             }), 'zero amount');
//         });
//
//         it('Should not be able to lock more than a year', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             await expectRevert(this.sfc.lockStake(testValidator3ID, (2 * 60 * 60 * 24 * 365), amount18('1'), {
//                 from: thirdDelegator,
//             }), 'incorrect duration');
//         });
//
//         it('Should not be able to lock more than validator lockup period', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             await expectRevert(this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 364), amount18('1'),
//                 { from: thirdDelegator }), 'validator\'s lockup will end too early');
//
//             await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 363), amount18('1'),
//                 { from: thirdDelegator });
//         });
//
//         it('Should be able to lock for 1 month', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 14), amount18('1'),
//                 { from: thirdDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 14)).toString());
//         });
//
//         it('Should not unlock if not locked up FTM', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 14), amount18('1'),
//                 { from: thirdDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 14)).toString());
//
//             await expectRevert(this.sfc.unlockStake(testValidator3ID, amount18('10')), 'not locked up');
//         });
//
//         it('Should not be able to unlock more than locked stake', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 14), amount18('1'),
//                 { from: thirdDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 14)).toString());
//
//             await expectRevert(this.sfc.unlockStake(testValidator3ID, amount18('10'), { from: thirdDelegator }), 'not enough locked stake');
//         });
//
//         it('Should scale unlocking penalty', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 60), amount18('1'),
//                 { from: thirdDelegator });
//
//             await sealEpoch(this.sfc, (new BN(1)).toString());
//
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('1'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.001280160336239103'));
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.5'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000640080168119551'));
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.01'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000012801603362390'));
//             await this.sfc.unlockStake(testValidator3ID, amount18('0.5'), { from: thirdDelegator });
//             await expectRevert(this.sfc.unlockStake(testValidator3ID, amount18('0.51'), { from: thirdDelegator }), 'not enough locked stake');
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.5'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000640080168119552'));
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.01'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000012801603362390'));
//         });
//
//         it('Should scale unlocking penalty with limiting to reasonable value', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 14), amount18('1'),
//                 { from: thirdDelegator });
//
//             await sealEpoch(this.sfc, (new BN(100)).toString());
//
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('1'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000380540964546690'));
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.5'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000190270482273344'));
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.01'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000003805409645466'));
//             await this.sfc.unlockStake(testValidator3ID, amount18('0.5'), { from: thirdDelegator });
//             await expectRevert(this.sfc.unlockStake(testValidator3ID, amount18('0.51'), { from: thirdDelegator }), 'not enough locked stake');
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.5'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000190270482273344'));
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.01'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000003805409645466'));
//
//             await this.sfc.relockStake(testValidator3ID, (60 * 60 * 24 * 14), amount18('1'),
//                 { from: thirdDelegator });
//
//             await expectRevert(this.sfc.unlockStake(testValidator3ID, amount18('1.51'), { from: thirdDelegator }), 'not enough locked stake');
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('1.5'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000190270482273344'));
//             expect(await this.sfc.unlockStake.call(testValidator3ID, amount18('0.5'), { from: thirdDelegator })).to.be.bignumber.equal(amount18('0.000063423494091114')); // 3 times smaller
//         });
//
//         it('Should unlock after period ended and stash rewards', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await this.sfc.delegate(testValidator3ID, {
//                 from: thirdDelegator,
//                 value: amount18('10'),
//             });
//
//             let unlockedStake = await this.sfc.getUnlockedStake(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//             let pendingRewards = await this.sfc.pendingRewards(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//
//             expect(unlockedStake.toString()).to.equal('10000000000000000000');
//             expect(web3.utils.fromWei(pendingRewards.toString(), 'ether')).to.equal('0');
//             await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 14), amount18('1'),
//                 { from: thirdDelegator });
//
//             unlockedStake = await this.sfc.getUnlockedStake(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//             pendingRewards = await this.sfc.pendingRewards(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//
//             expect(unlockedStake.toString()).to.equal('9000000000000000000');
//             expect(web3.utils.fromWei(pendingRewards.toString(), 'ether')).to.equal('0');
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 14)).toString());
//
//             unlockedStake = await this.sfc.getUnlockedStake(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//             pendingRewards = await this.sfc.pendingRewards(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//
//             expect(unlockedStake.toString()).to.equal('9000000000000000000');
//             expect(web3.utils.fromWei(pendingRewards.toString(), 'ether')).to.equal('17682.303362391033619905');
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 14)).toString());
//             pendingRewards = await this.sfc.pendingRewards(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//
//             unlockedStake = await this.sfc.getUnlockedStake(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//             expect(unlockedStake.toString()).to.equal('10000000000000000000');
//             expect(web3.utils.fromWei(pendingRewards.toString(), 'ether')).to.equal('136316.149516237187466057');
//
//             await this.sfc.stashRewards(thirdDelegator, testValidator3ID, { from: thirdDelegator });
//         });
//     });
// });
//
// contract('SFC', async ([firstValidator, testValidator, firstDelegator, secondDelegator, thirdDelegator, account1, account2, account3]) => {
//     let testValidator1ID;
//     let testValidator2ID;
//     let testValidator3ID;
//
//     beforeEach(async () => {
//         this.sfc = await SFCI.at((await UnitTestSFC.new()).address);
//         const nodeIRaw = await NodeDriver.new();
//         const evmWriter = await StubEvmWriter.new();
//         this.nodeI = await NodeDriverAuth.new();
//         this.sfcLib = await UnitTestSFCLib.new();
//         const initializer = await NetworkInitializer.new();
//         await initializer.initializeAll(0, 0, this.sfc.address, this.sfcLib.address, this.nodeI.address, nodeIRaw.address, evmWriter.address, firstValidator);
//         this.consts = await ConstantsManager.at(await this.sfc.constsAddress.call());
//         await this.sfc.rebaseTime();
//         await this.sfc.enableNonNodeCalls();
//
//         await this.consts.updateBaseRewardPerSecond(amount18('1'));
//
//         await this.sfc.createValidator(pubkey, {
//             from: account1,
//             value: amount18('10'),
//         });
//
//         await this.sfc.createValidator(pubkey1, {
//             from: account2,
//             value: amount18('5'),
//         });
//
//         await this.sfc.createValidator(pubkey2, {
//             from: account3,
//             value: amount18('1'),
//         });
//
//         await sealEpoch(this.sfc, (new BN(0)).toString());
//
//         testValidator1ID = await this.sfc.getValidatorID(account1);
//         testValidator2ID = await this.sfc.getValidatorID(account2);
//         testValidator3ID = await this.sfc.getValidatorID(account3);
//
//         await this.sfc.lockStake(testValidator3ID, (60 * 60 * 24 * 364), amount18('1'),
//             { from: account3 });
//
//         await sealEpoch(this.sfc, (new BN(0)).toString());
//     });
//
//     describe('Test Rewards with lockup Calculation', () => {
//         it('Should not update slashing refund ratio', async () => {
//             await sealEpoch(this.sfc, (new BN(1000)).toString());
//
//             await expectRevert(this.sfc.updateSlashingRefundRatio(testValidator3ID, 1, {
//                 from: firstValidator,
//             }), "validator isn't slashed");
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 14)).toString());
//         });
//
//         it('Should not sync if validator does not exist', async () => {
//             await expectRevert(this.sfc._syncValidator(33, false), "validator doesn't exist");
//         });
//     });
// });
//
// // calc rewards in ether with a round down
// const calcRewardsJs = (lockDuration, lockedAmount, stakedAmount, totalStakedAmount, rawReward) => {
//     let rewards = {extra: 0, base: 0, unlocked: 0, penalty: 0, sum: 0};
//     // note: calculation for commission isn't accurate
//     let commissionFull = Math.floor(rawReward * 15 / 100);
//     // let commissionFullLocked = Math.floor(commissionFull * lockedAmount / stakedAmount);
//     // let commissionFullUnlocked = commissionFull - commissionFullLocked;
//     // if (isValidator) {
//     //     rewards.extra = Math.floor(commissionFullLocked * 0.7 * lockDuration / (86400 * 365));
//     //     rewards.base = Math.floor(commissionFullLocked * 0.3);
//     //     rewards.unlocked = Math.floor(commissionFullUnlocked * 0.3);
//     // }
//     let delegatorRewards = rawReward - commissionFull;
//     let accRate = Math.floor(delegatorRewards / totalStakedAmount);
//     rewards.extra += Math.floor(accRate * lockedAmount * 0.7 * lockDuration / (86400 * 365));
//     rewards.base += Math.floor(accRate * lockedAmount * 0.3);
//     rewards.unlocked += Math.floor(accRate * (stakedAmount - lockedAmount)  * 0.3);
//     rewards.penalty = Math.floor(rewards.extra + rewards.base/2);
//     rewards.sum = rewards.extra + rewards.base + rewards.unlocked;
//     return rewards;
// }
//
// contract('SFC', async ([firstValidator, secondValidator, firstDelegator, secondDelegator, thirdDelegator, account1, account2, account3]) => {
//     let testValidator1ID;
//     let testValidator2ID;
//     let testValidator3ID;
//     beforeEach(async () => {
//         this.sfc = await SFCI.at((await UnitTestSFC.new()).address);
//         const nodeIRaw = await NodeDriver.new();
//         const evmWriter = await StubEvmWriter.new();
//         this.nodeI = await NodeDriverAuth.new();
//         this.sfcLib = await UnitTestSFCLib.new();
//         const initializer = await NetworkInitializer.new();
//         await initializer.initializeAll(0, 0, this.sfc.address, this.sfcLib.address, this.nodeI.address, nodeIRaw.address, evmWriter.address, firstValidator);
//         this.consts = await ConstantsManager.at(await this.sfc.constsAddress.call());
//         await this.sfc.rebaseTime();
//         await this.sfc.enableNonNodeCalls();
//
//         await this.consts.updateBaseRewardPerSecond('1');
//
//         await this.sfc.createValidator(pubkey, {
//             from: firstValidator,
//             value: amount18('10')
//         });
//         firstValidatorID = await this.sfc.getValidatorID(firstValidator);
//         await this.sfc.delegate(firstValidatorID, {
//             from: firstDelegator,
//             value: amount18('10')
//         });
//         await this.sfc.lockStake(firstValidatorID, (60 * 60 * 24 * 365), amount18('5'),
//             { from: firstValidator });
//         await sealEpoch(this.sfc, (new BN(0)).toString());
//     });
//
//     describe('Test fluid relocks', () => {
//         // orig lock T1 -------------t1----> T2
//         // relock           T3---------------------t2------>T3
//         it('Relock happy path, lock, relock, no premature unlocks', async () => {
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             rewardBeforeLock = calcRewardsJs(0, 0, 10, 20, 86400);
//
//             await this.sfc.lockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 7)).toString());
//             rewardBeforeRelock = calcRewardsJs(86400 * 14, 5, 10, 20, 86400 * 7);
//             await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 14)).toString());
//             rewardAfterUnlock = calcRewardsJs(86400 * 14, 10, 10, 20, 86400 * 14);
//
//             expectedReward = rewardBeforeLock.sum + rewardBeforeRelock.sum + rewardAfterUnlock.sum;
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString())
//                 .to.equals(expectedReward.toString());
//         });
//         it('Relock happy path, lock, relock no amount added, no premature unlocks', async () => {
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             rewardBeforeLock = calcRewardsJs(0, 0, 10, 20, 86400);
//
//             await this.sfc.lockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 7)).toString());
//             rewardBeforeRelock = calcRewardsJs(86400 * 14, 5, 10, 20, 86400 * 7);
//             await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('0'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 14)).toString());
//             rewardAfterUnlock = calcRewardsJs(86400 * 14, 5, 10, 20, 86400 * 14);
//
//             expectedReward = rewardBeforeLock.sum + rewardBeforeRelock.sum + rewardAfterUnlock.sum;
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString())
//                 .to.equals(expectedReward.toString());
//         });
//         it('Relock happy path, lock, relock, unlock at t1', async () => {
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             rewardBeforeLock = calcRewardsJs(0, 0, 10, 20, 86400);
//
//             await this.sfc.lockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 7)).toString());
//             rewardBeforeRelock = calcRewardsJs(86400 * 14, 5, 10, 20, 86400 * 7);
//             await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 2)).toString());
//             rewardAfterUnlock = calcRewardsJs(86400 * 14, 10, 10, 20, 86400 * 2);
//             let expectedPenalty = rewardBeforeRelock.penalty + rewardAfterUnlock.penalty;
//
//             expect((await this.sfc.unlockStake.call(firstValidatorID, amount18('10'), { from: firstDelegator })).toString())
//                 .to.equals(expectedPenalty.toString());
//
//             expectedReward = rewardBeforeLock.sum + rewardBeforeRelock.sum + rewardAfterUnlock.sum;
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString())
//                 .to.equals(expectedReward.toString());
//         });
//         it('Relock happy path, lock, relock, unlock at t2', async () => {
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             rewardBeforeLock = calcRewardsJs(0, 0, 10, 20, 86400);
//
//             await this.sfc.lockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 7)).toString());
//             rewardBeforeRelock = calcRewardsJs(86400 * 14, 5, 10, 20, 86400 * 7);
//             await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 12)).toString());
//             rewardAfterUnlock = calcRewardsJs(86400 * 14, 10, 10, 20, 86400 * 12);
//             let expectedPenalty = rewardAfterUnlock.penalty;
//             expect((await this.sfc.unlockStake.call(firstValidatorID, amount18('10'), { from: firstDelegator })).toString())
//                 .to.equals(expectedPenalty.toString());
//
//             expectedReward = rewardBeforeLock.sum + rewardBeforeRelock.sum + rewardAfterUnlock.sum;
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString())
//                 .to.equals(expectedReward.toString());
//         });
//         it('Cannot relock if relock limit is exceeded', async () => {
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             rewardBeforeLock = calcRewardsJs(0, 0, 10, 20, 86400);
//
//             await this.sfc.lockStake(firstValidatorID, (60 * 60 * 24 * 20), amount18('5'),
//                 { from: firstDelegator });
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//
//             { // 1
//                 await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 20), amount18('0'),
//                     { from: firstDelegator });
//                 await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             }
//             { // 2
//                 await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 20), amount18('0'),
//                     { from: firstDelegator });
//                 await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             }
//             { // 3
//                 await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 20), amount18('0'),
//                     { from: firstDelegator });
//                 await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             }
//             {
//                 await expectRevert(this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 20), amount18('0'),
//                     { from: firstDelegator }), "too frequent relocks");
//             }
//             { // 4
//                 await this.sfc.advanceTime(60 * 60 * 24 * 14);
//                 await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 20), amount18('0'),
//                     { from: firstDelegator });
//                 await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             }
//             {
//                 await expectRevert(this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 20), amount18('0'),
//                     { from: firstDelegator }), "too frequent relocks");
//             }
//             for (i = 5; i <= 40; i++) { // 5-40
//                 await this.sfc.advanceTime(60 * 60 * 24 * 14);
//                 await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 20), amount18('0'),
//                     { from: firstDelegator });
//                 await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//                 // ensure validator's lockup period doesn't end too early
//                 await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 365), amount18('0'),
//                     { from: firstValidator });
//             }
//         });
//         it('Partial unlock at t1, unlock amount < original lock amount', async () => {
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24)).toString());
//             rewardBeforeLock = calcRewardsJs(0, 0, 10, 20, 86400);
//
//             await this.sfc.lockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 7)).toString());
//             rewardBeforeRelock = calcRewardsJs(86400 * 14, 5, 10, 20, 86400 * 7);
//             await this.sfc.relockStake(firstValidatorID, (60 * 60 * 24 * 14), amount18('5'),
//                 { from: firstDelegator });
//
//             await sealEpoch(this.sfc, (new BN(60 * 60 * 24 * 2)).toString());
//             rewardAfterUnlock = calcRewardsJs(86400 * 14, 10, 10, 20, 86400 * 2);
//             let penaltyShareBeforeRelock = Math.floor(rewardBeforeRelock.penalty * 2 / 10);
//             let penaltyShareAfterUnlock = Math.floor(rewardAfterUnlock.penalty * 2 / 10);
//             expectedPenalty = penaltyShareBeforeRelock + penaltyShareAfterUnlock;
//
//             expect((await this.sfc.unlockStake.call(firstValidatorID, amount18('2'), { from: firstDelegator })).toString())
//                 .to.equals(expectedPenalty.toString());
//             expectedReward = rewardBeforeLock.sum + rewardBeforeRelock.sum + rewardAfterUnlock.sum;
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString())
//                 .to.equals(expectedReward.toString());
//
//             await this.sfc.advanceTime(60 * 60 * 24 * 5 - 1);
//
//             expect((await this.sfc.unlockStake.call(firstValidatorID, amount18('2'), { from: firstDelegator })).toString())
//                 .to.equals(expectedPenalty.toString());
//             expectedReward = rewardBeforeLock.sum + rewardBeforeRelock.sum + rewardAfterUnlock.sum;
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString())
//                 .to.equals(expectedReward.toString());
//
//             await this.sfc.advanceTime(2);
//
//             expectedPenalty = penaltyShareAfterUnlock;
//             expect((await this.sfc.unlockStake.call(firstValidatorID, amount18('2'), { from: firstDelegator })).toString())
//                 .to.equals(expectedPenalty.toString());
//             expectedReward = rewardBeforeLock.sum + rewardBeforeRelock.sum + rewardAfterUnlock.sum;
//             expect((await this.sfc.pendingRewards(firstDelegator, firstValidatorID)).toString())
//                 .to.equals(expectedReward.toString());
//
//         });
//     });
// });
