const DappToken = artifacts.require("DappToken");

contract("DappToken", function (accounts) {
  it("Initialize contract with correct values", async function () {
    const instance = await DappToken.deployed();
    const name = await instance.name();
    const symbol = await instance.symbol();
    const standard = await instance.standard();
    assert(name, "DappToken", "has the correct name");
    assert(symbol, "DAPP", "has the correct symbol");
    assert(standard, "DAPP Token v1.0", "has the correct standard");
  });

  it("allocates the total supply upon development", async function () {
    const instance = await DappToken.deployed();
    const totalSupply = await instance.totalSupply();
    assert(
      totalSupply.toNumber(),
      1000000,
      "sets the total supply to 1.000,000"
    );
    assert(
      instance.balanceOf(accounts[0]),
      1000000,
      "it allocates the initial supply to the admin account"
    );
  });

  it("transfers tokens from one account to another", async function () {
    const instance = await DappToken.deployed();

    try {
      await instance.transfer.call(accounts[1], 1000000000000, {
        from: accounts[0],
      });
    } catch (err) {
      assert(err.message.indexOf("revert") > 0, "error should contain revert");
    }

    const transaction = await instance.transfer(accounts[1], 500000, {
      from: accounts[0],
    });

    assert(
      await instance.balanceOf(accounts[0]),
      500000,
      "decrease the tokens from sender"
    );
    assert(
      await instance.balanceOf(accounts[1]),
      500000,
      "increase the tokens to receiver"
    );
    assert(transaction.logs[0].event, "Transfer", "should send transfer event");
  });

  it("approves tokens for delegated transfers", async function () {
    const instance = await DappToken.deployed();

    const transaction = await instance.approve(accounts[1], 500000, {
      from: accounts[0],
    });

    await assert(
      await instance.allowance(accounts[0], accounts[0]),
      500000,
      "has correct allowance"
    );

    assert(transaction.logs[0].event, "Approval", "should send Approval event");
  });

  it("transfers delegated amount", async function () {
    const instance = await DappToken.deployed();

    await instance.approve(accounts[1], 500000, {
      from: accounts[0],
    });

    try {
      await instance.transferFrom(accounts[0], accounts[2], 600000, {
        from: accounts[1],
      });
    } catch (err) {
      assert(err.message.indexOf("revert") > 0, "error should contain revert");
    }

    const transaction = await instance.transferFrom(
      accounts[0],
      accounts[2],
      500000,
      {
        from: accounts[1],
      }
    );

    assert(
      await instance.balanceOf(accounts[0]),
      500000,
      "decrease the tokens from sender"
    );
    assert(
      await instance.balanceOf(accounts[2]),
      500000,
      "increase the tokens to receiver"
    );
    assert(transaction.logs[0].event, "Transfer", "should send transfer event");
  });
});
