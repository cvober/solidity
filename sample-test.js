const { expect } = require("chai");
const { ethers } = require("hardhat");

beforeEach(async function () {
  Bank = await ethers.getContractFactory("Bank");
  [admin, addr1, addr2, addr3] = await ethers.getSigners();
  
  bank = await Bank.deploy(admin.getAddress(), admin.getAddress());//   запрос на транзакцию
  await bank.deployed();// пока транзакция не выполнена

});

describe("Bank", async function(){
  it("1) add Admin test(admin)", async function () {
    await bank.connect(admin).addAdmin(addr1.getAddress());
    _AdminID = 2;
    Admins = await bank.connect(admin).Admins(_AdminID);
    _MapAdmins = await bank.connect(admin).MapAdmins(addr1.getAddress());

    _addr1 = addr1.getAddress();
    expect(Admins.AdminsID).to.equal(_AdminID);
    //expect(Admins.Owner).to.equal(addr1.getAddress());
    expect(_MapAdmins).to.equal(Admins.AdminsID);



  });
  it("2) add Admin test(user)", async function () {
    await bank.connect(addr2).addAdmin(addr1.getAddress());

  });

  it("3) updateDonathion test(admin)", async function(){
    _donate = 1234567890;
    await bank.connect(admin).updateDonathion(addr3.getAddress(), _donate);
    foud = await bank.connect(admin).Fund();
    _newDonate = await bank.connect(admin).Donathion();

    _addr3 = addr3.getAddress();
    expect(_donate).to.equal(_newDonate);
    expect(foud).to.equal(await _addr3);


  });

  it("4) updateDonathion test(user)", async function(){
    _donate = 1234567890;
    await bank.connect(addr2).updateDonathion(addr3.getAddress(), _donate);
    foud = await bank.connect(admin).Fund();
    _newDonate = await bank.connect(admin).Donathion();

    _addr3 = addr3.getAddress();
    expect(_donate).to.equal(_newDonate);
    expect(foud).to.equal(_addr3);

  });

  it("5) changeSubscripthion test(admin)", async function(){
    price = 1234567890;
    await bank.connect(admin).changeSubscripthion(price);
    _newPrice = await bank.connect(admin).Subscription();

    expect(price).to.equal(_newPrice);

  });

  it("6) changeSubscripthion test(user)", async function(){
    price = 1234567890;
    await bank.connect(addr2).changeSubscripthion(price);
    _newPrice = await bank.connect(admin).Subscription();

    expect(price).to.equal(_newPrice);

  });
  
  it("7) changeSubscripthion test(user)", async function(){
    price = 1234567890;
    await bank.connect(addr2).changeSubscripthion(price);
    _newPrice = await bank.connect(admin).Subscription();

    expect(price).to.equal(_newPrice);
  });

  it("8)CreateAccount", async function(){
    await bank.connect(addr1).createAccount();
    NewAccount = await bank.connect(addr1).Accounts(1);
    MapAccount = await bank.connect(addr1).MapAccounst(addr1.getAddress());
    _AccountsID = await bank.connect(addr1).AccountsID();

    expect(NewAccount.AccountsID).to.equal(1);
    expect(NewAccount.Status).to.equal(0);
    expect(NewAccount.Owner).to.equal(await addr1.getAddress());
    expect(NewAccount.Balance).to.equal(0);
    expect(_AccountsID).to.equal(2);
    //await bank.connect(addr1).createAccount();
  });

  it("9)deposit", async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});

    Account = await bank.connect(addr1).Accounts(1);
    expect(Account.Balance).to.equal(ethers.utils.parseEther("0.5"));
 
  });

  it("10)withdraw", async function(){
    await bank.connect(addr1).createAccount();

    //await expect(await wallet.sendTransaction({to: walletTo.address, value: 200}))
  //.to.changeEtherBalance(wallet, -200);

    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});
    //Изменение счета адресса
    //addr1.to.changeEtherBalance(ethers.utils.parseEther("0.5"));

    AccountBefore = await bank.connect(addr1).Accounts(1);
    await bank.connect(addr1).withdraw(ethers.utils.parseEther("0.5"));
    AccountAfter = await bank.connect(addr1).Accounts(1);

    expect(AccountBefore.Balance - ethers.utils.parseEther("0.5")).to.equal(AccountAfter.Balance);

  });

  it("11)transferInBank", async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr2).createAccount();

    await bank.connect(addr1).deposit({value:ethers.utils.parseEther("0.5")});

    AccountFrom_Before = await bank.connect(addr1).Accounts(1);
    AccountTo_Before = await bank.connect(addr2).Accounts(2);

    await bank.connect(addr1).transferInBank(addr2.getAddress(), ethers.utils.parseEther("0.5"));//(Account_1.Owner, Account_2.Owner);

    AccountFrom_After = await bank.connect(addr1).Accounts(1);
    AccountTo_After = await bank.connect(addr2).Accounts(2);

    expect(AccountFrom_Before.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(AccountTo_Before.Balance).to.equal(0);

    expect(AccountFrom_After.Balance).to.equal(0);
    expect(AccountTo_After.Balance).to.equal(ethers.utils.parseEther("0.5"));

  });

  it("12) buySubscription", async function(){
    await bank.connect(addr1).createAccount();
    AccountBefore = await bank.connect(addr1).Accounts(1);
    expect(AccountBefore.Status).to.equal(0);

    //другое значение проверить
    await bank.connect(addr1).buySubscription({value: "100000000"});
    AccountAfter = await bank.connect(addr1).Accounts(1);
    expect(AccountAfter.Status).to.equal(1);

  });

  it("13)pushLongDeposit", async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});

    await bank.connect(addr1).transferAccountToInvestor(ethers.utils.parseEther("0.5"));
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).pushLongDeposit(ethers.utils.parseEther("0.5"));

    InvestorAfter = await bank.connect(addr1).Investors(1);

    expect(InvestorBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(InvestorBefore.PaymentLong.Amount).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(0);
    expect(InvestorAfter.PaymentLong.Amount).to.equal(ethers.utils.parseEther("0.5"));    
  });

  it("14)getLongDeposit(Normal)", async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});

    await bank.connect(addr1).transferAccountToInvestor(ethers.utils.parseEther("0.5"));
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).pushLongDeposit(ethers.utils.parseEther("0.5"));

    InvestorAfter = await bank.connect(addr1).Investors(1);

    expect(InvestorBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(InvestorBefore.PaymentLong.Amount).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(0);
    expect(InvestorAfter.PaymentLong.Amount).to.equal(ethers.utils.parseEther("0.5")); 

    await bank.connect(addr1).getLongDeposit();
    InvestorGetDeposit = await bank.connect(addr1).Investors(1);

    expect(InvestorGetDeposit.Balance).to.equal(ethers.utils.parseEther("1"));
    expect(InvestorGetDeposit.PaymentLong.Amount).to.equal(0);
    expect(InvestorAfter.PaymentLong.Time < InvestorGetDeposit.PaymentLong.Time);
    //в рамках теста, процент начисления 100% для обычной подписки
  });

  it("15)getLongDeposit(VIP)", async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});

    await bank.connect(addr1).transferAccountToInvestor(ethers.utils.parseEther("0.5"));
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).pushLongDeposit(ethers.utils.parseEther("0.5"));

    InvestorAfter = await bank.connect(addr1).Investors(1);

    expect(InvestorBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(InvestorBefore.PaymentLong.Amount).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(0);
    expect(InvestorAfter.PaymentLong.Amount).to.equal(ethers.utils.parseEther("0.5")); 

    await bank.connect(addr1).buySubscription({value: "100000000"});
    await bank.connect(addr1).getLongDeposit();
    InvestorGetDeposit = await bank.connect(addr1).Investors(1);

    expect(InvestorGetDeposit.Balance).to.equal(ethers.utils.parseEther("1.5"));
    expect(InvestorGetDeposit.PaymentLong.Amount).to.equal(0);
    expect(InvestorAfter.PaymentLong.Time < InvestorGetDeposit.PaymentLong.Time);
    //в рамках теста, процент начисления 200% для обычной подписки
  });

  it("16)pushSortDeposit", async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});

    await bank.connect(addr1).transferAccountToInvestor(ethers.utils.parseEther("0.5"));
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).pushShortDeposit(ethers.utils.parseEther("0.5"));

    InvestorAfter = await bank.connect(addr1).Investors(1);

    expect(InvestorBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(InvestorBefore.PaymentShort.Amount).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(0);
    expect(InvestorAfter.PaymentShort.Amount).to.equal(ethers.utils.parseEther("0.5"));  
  });

  it("17)getShortDeposit(Normal)",async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});

    await bank.connect(addr1).transferAccountToInvestor(ethers.utils.parseEther("0.5"));
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).pushShortDeposit(ethers.utils.parseEther("0.5"));

    InvestorAfter = await bank.connect(addr1).Investors(1);

    expect(InvestorBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(InvestorBefore.PaymentShort.Amount).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(0);
    expect(InvestorAfter.PaymentShort.Amount).to.equal(ethers.utils.parseEther("0.5")); 

    await bank.connect(addr1).getShortDeposit();
    InvestorGetDeposit = await bank.connect(addr1).Investors(1);

    expect(InvestorGetDeposit.Balance).to.equal(ethers.utils.parseEther("1"));
    expect(InvestorGetDeposit.PaymentShort.Amount).to.equal(0);
    expect(InvestorAfter.PaymentShort.Time < InvestorGetDeposit.PaymentShort.Time);
    //в рамках теста, процент начисления 100% для обычной подписки
  });

  it("18)getShortDeposit(VIP)",async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});

    await bank.connect(addr1).transferAccountToInvestor(ethers.utils.parseEther("0.5"));
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).pushShortDeposit(ethers.utils.parseEther("0.5"));

    InvestorAfter = await bank.connect(addr1).Investors(1);

    expect(InvestorBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(InvestorBefore.PaymentShort.Amount).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(0);
    expect(InvestorAfter.PaymentShort.Amount).to.equal(ethers.utils.parseEther("0.5")); 

    await bank.connect(addr1).buySubscription({value: "100000000"});
    await bank.connect(addr1).getShortDeposit();
    InvestorGetDeposit = await bank.connect(addr1).Investors(1);

    expect(InvestorGetDeposit.Balance).to.equal(ethers.utils.parseEther("1.5"));
    expect(InvestorGetDeposit.PaymentShort.Amount).to.equal(0);
    expect(InvestorAfter.PaymentShort.Time < InvestorGetDeposit.PaymentShort.Time);
    //в рамках теста, процент начисления 100% для обычной подписки
  });

  it("19)updatePeriodTimeShort(admin)", async function(){
    await bank.connect(admin).updatePeriodTimeShort(1000000);
    NewTime = await bank.connect(admin).PeriodShort();
    expect(NewTime).to.equal(1000000)
  });

  it("20)updatePeriodTimeShort(user)", async function(){
    await bank.connect(addr1).updatePeriodTimeShort(1000000);
    NewTime = await bank.connect(admin).PeriodShort();
    expect(NewTime).to.equal(1000000)
  });

  it("21)updatePeriodTimeLong(admin)", async function(){
    await bank.connect(admin).updatePeriodTimeLong(1000000);
    NewTime = await bank.connect(admin).PeriodLong();
    expect(NewTime).to.equal(1000000)
  });

  it("22)updatePeriodTimeLong(user)", async function(){
    await expect (await bank.connect(addr1).updatePeriodTimeLong(1000000)).to.be.revertedWith('Yes');
    NewTime = await bank.connect(addr1).PeriodLong();
    expect(NewTime).to.equal(1000000);
  });

  it("23)updateSubscriptionTime",async function(){
    await bank.connect(addr1).createAccount();
    Account = await bank.connect(addr1).Accounts(1);
    await bank.connect(addr1).updateSubscriptionTime(Account.AccountsID, 10000000);// 2 - период подписки 
    UpdateAccount = await bank.connect(addr1).Accounts(1);
    expect(Account.SubscriptionTime <= UpdateAccount.SubscriptionTime);
  });

  it("24)transferAccountToInvestor",async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});
    AccountBefore = await bank.connect(addr1).Accounts(1);
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).transferAccountToInvestor(ethers.utils.parseEther("0.5"));

    AccountAfter = await bank.connect(addr1).Accounts(1);
    InvestorAfter = await bank.connect(addr1).Investors(1);

    expect(AccountBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(InvestorBefore.Balance).to.equal(0);
    expect(AccountAfter.Balance).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(ethers.utils.parseEther("0.5"));
  });

  it("25)transferInvestorToAccount",async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});
    AccountBefore = await bank.connect(addr1).Accounts(1);
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).transferAccountToInvestor(ethers.utils.parseEther("0.5"));

    expect(AccountBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(InvestorBefore.Balance).to.equal(0);
    expect(AccountAfter.Balance).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(ethers.utils.parseEther("0.5"));

    AccountBefore = await bank.connect(addr1).Accounts(1);
    InvestorBefore = await bank.connect(addr1).Investors(1);

    await bank.connect(addr1).transferInvestorToAccount(ethers.utils.parseEther("0.5"));

    AccountAfter = await bank.connect(addr1).Accounts(1);
    InvestorAfter = await bank.connect(addr1).Investors(1);

    expect(InvestorBefore.Balance).to.equal(ethers.utils.parseEther("0.5"));
    expect(AccountBefore.Balance).to.equal(0);
    expect(InvestorAfter.Balance).to.equal(0);
    expect(AccountAfter.Balance).to.equal(ethers.utils.parseEther("0.5"));
    
  });

  it("26)getBalanceAccount", async function(){
    await bank.connect(addr1).createAccount();
    await bank.connect(addr1).deposit({value: ethers.utils.parseEther("0.5")});
    Account = await bank.connect(addr1).Accounts(1);

    _balance = await bank.connect(addr1).getBalanceAccount();
    expect(_balance).to.equal(ethers.utils.parseEther("0.5"))

  });

});