// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

interface  IFlashLoanEtherReceiver{
    function execute() external payable;
}

contract Bank{
    address public Owner; 
    address public Fund = 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db; //0x6138cb4ca571B9C45F7fb24503168b9D3533f126; //https://thewaterproject.org/
    uint public Donation = 10000;

    uint public AccountsID = 1;
    uint public AdminsID = 1;
    uint public PeriodLong = 365 days;
    uint public PeriodShort = 30 days;

    enum subscription { NORMAL, VIP }
    uint public Subscription = 10**8;
    uint public PeriodSubscription = 30 days;

    uint public NormalSubscriptionLong = 100;
    uint public VIPSubscriptionLong = 200;
    uint public NormalSubscriptionShort = 100;
    uint public VIPSubscriptionShort = 200;

    bool public FlagFlashLoan = false;

    struct investment
    {
        uint Amount;
        uint Time;
    }

    struct payment
    {
        uint Amount;
        uint Time;
    }

    struct investor
    {
        uint AccountsID;
        payment PaymentShort;
        investment PaymentLong;
        uint Balance;

    }

    struct account
    {
        uint AccountsID;
        subscription Status;
        uint SubscriptionTime;
        address Owner;
        uint Balance;
    }

    struct admin
    {
        uint AdminsID;
        address Owner;
    }

    account[] public Accounts;
    admin[] public Admins;
    investor[] public Investors;
    mapping (address => uint) public MapAccounst;
    mapping (address => uint) public MapAdmins;

    constructor(address _admin, address _owner)
    {
        Accounts.push(account(0, subscription(0), 0, address (0), 0));
        Investors.push(investor(0,payment(0,block.timestamp),investment(0,block.timestamp) ,0));
        Admins.push(admin(0,address (0)));

        Owner = _owner;
        Admins.push(admin(AdminsID, _admin));
        MapAdmins[msg.sender] = AdminsID;
        AdminsID++;
    }

    modifier adminOnly()
    {
        require(MapAdmins[msg.sender] != 0, "Only admin can call this functhion");
        _;
    }
/*
    modifier userOnly()
    {
        require(MapAdmins[msg.sender] == 0, "Only admin can call this functhion");
        _;
    }
*/
/*
    modifier onlyOwner()
    {
        require(msg.sender == Owner, "Only admin can call this functhion");
        _;
    }
*/
/*
    modifier onlyVIP()
    {
        require(Accounts[MapAccounst[msg.sender]].Status == subscription(1), "Only VIP can call this functhion");
        _;
    }
*/
    function addAdmin(address _admin) external adminOnly
    {
        Admins.push(admin(AdminsID, _admin));
        MapAdmins[_admin] = AdminsID;
        AdminsID++;
    }

    function updateDonathion(address _fund,  uint _donation) external adminOnly
    {
        Fund = _fund;
        Donation = _donation;
    }

    function changeSubscripthion(uint price) external adminOnly
    {
        Subscription = price;
    }

    function createAccount() public payable
    {
        require(MapAccounst[msg.sender] == 0, "Sorry, you can create only one account per wallet ");
        require(msg.value >= Donation, "Donation is so small. Be kind");
        Accounts.push(account(AccountsID,subscription(0), 0, msg.sender, 0));
        Investors.push(investor(AccountsID, payment(0,block.timestamp), investment(0,block.timestamp), 0));
        
        MapAccounst[msg.sender] = AccountsID;
        payable(Fund).transfer(msg.value);

        AccountsID++;
    }

    function withdraw(uint _amount) external payable
    {
        uint _AccuntsID = MapAccounst[msg.sender];
        require(Accounts[_AccuntsID].Balance >= _amount,"No money");
        require(_AccuntsID != 0,"No account");
        
        Accounts[_AccuntsID].Balance -= _amount;
        payable(msg.sender).transfer(_amount);
    }

    function transferInBank(address _to, uint _amount) external //Перевод внутри контракта
    {
        uint indexTo = MapAccounst[_to];
        uint indexFrom = MapAccounst[msg.sender];
        require((Accounts[indexFrom].Balance >= _amount) && (indexTo != 0) && (indexFrom != 0),"Sorry,it's wallet won't find!");
        
        Accounts[indexFrom].Balance -= _amount;
        Accounts[indexTo].Balance += _amount;
    }

    function deposit() public payable 
    {
        require(MapAccounst[msg.sender] != 0, "Sorry, your wallet won't find!");
        require(FlagFlashLoan == false, "You cannot use a deposit during a loan!");
        uint _ID = MapAccounst[msg.sender];
        Accounts[_ID].Balance += msg.value;
    }

    function flashLoan(uint amount) external{
        FlagFlashLoan = true;
        uint balanceBefore = address(this).balance;
        require(balanceBefore >= amount,"Not enought ETH balance");
        IFlashLoanEtherReceiver(msg.sender).execute{value: amount}();
        require(address(this).balance >= balanceBefore,"Flash loan has't been paid back");
        FlagFlashLoan = false;
    }

    function buySubscription() public payable
    {
        uint _AccuntsID = MapAccounst[msg.sender];
        require(_AccuntsID != 0, "Not account");
        require(msg.value == Subscription, "not equal");
        require(msg.value >= Subscription, "i need more money");

        Accounts[_AccuntsID].Status = subscription(1);
        Accounts[_AccuntsID].SubscriptionTime = block.timestamp;
    }

    function getLongDeposit() public returns(uint)
    {
        uint realTime = block.timestamp + 365 days;
        uint _AccountID = MapAccounst[msg.sender];
        require(_AccountID != 0, "Not user");
        uint checkInvestmentTime = Investors[_AccountID].PaymentLong.Time + PeriodLong;
        require((checkInvestmentTime < realTime) || (Investors[_AccountID].PaymentLong.Amount == 0), "TIME!!!");

        uint _balance = Investors[_AccountID].PaymentLong.Amount;
        uint payTime = Investors[_AccountID].PaymentLong.Time;
        updateSubscriptionTime(_AccountID, PeriodLong);

        if(Accounts[_AccountID].Status == subscription(0))
        {
            uint percent = 
            (
                (
                    (((realTime - payTime) / PeriodLong) ) * NormalSubscriptionLong
                    + 
                    (((realTime - payTime) % PeriodLong) * NormalSubscriptionLong) / (PeriodLong)
                )
            );            
            
            uint value = ((_balance * percent) / 100)  +_balance;
            Investors[_AccountID].PaymentLong.Amount = 0;
            Investors[_AccountID].PaymentLong.Time = block.timestamp;
            Investors[_AccountID].Balance += value;
            return value;
        }

        else
        {
            uint percent = 
            (
                (
                    (((realTime - payTime) / PeriodLong) ) * VIPSubscriptionLong
                    + 
                    (((realTime - payTime) % PeriodLong) * VIPSubscriptionLong) / (PeriodLong)
                )
            ); 
            uint value = ((_balance * percent) / 100)  +_balance;
            Investors[_AccountID].PaymentLong.Amount = 0;
            Investors[_AccountID].PaymentLong.Time = block.timestamp;
            Investors[_AccountID].Balance += value;
            return value;
        }
    }

    function pushLongDeposit(uint amount) public
    {
        uint _AccuntsID = MapAccounst[msg.sender];
        require (_AccuntsID != 0, "No user(");
        require (Investors[_AccuntsID].Balance >= amount, "No money(");

        uint value = getLongDeposit();
        Investors[_AccuntsID].Balance -= amount;
        Investors[_AccuntsID].PaymentLong.Amount = amount;
        Investors[_AccuntsID].PaymentLong.Time = block.timestamp;
        Investors[_AccuntsID].Balance += value;
    }

    function getShortDeposit() public returns(uint)
    {
        uint realTime = block.timestamp + 30 days; //-30
        uint _AccuntsID = MapAccounst[msg.sender];
        require(_AccuntsID != 0, "Not user");
        uint _balance = Investors[_AccuntsID].PaymentShort.Amount;
        uint payTime = Investors[_AccuntsID].PaymentShort.Time;
        updateSubscriptionTime(_AccuntsID, PeriodShort);

        if(Accounts[_AccuntsID].Status == subscription(0))
        {
            uint percent = 
            (
                (
                    (((realTime - payTime) / PeriodShort) ) * NormalSubscriptionShort
                    + 
                    (((realTime - payTime) % PeriodShort) * NormalSubscriptionShort) / (PeriodShort)
                )
            );            
            
            uint value = ((_balance * percent) / 100)  +_balance;
            Investors[_AccuntsID].PaymentShort.Amount = 0;
            Investors[_AccuntsID].PaymentShort.Time = block.timestamp;
            Investors[_AccuntsID].Balance += value;
            return value;
        }

        else
        {
            uint percent = 
            (
                (
                    (((realTime - payTime) / PeriodShort) ) * VIPSubscriptionShort
                    + 
                    (((realTime - payTime) % PeriodShort) * VIPSubscriptionShort) / (PeriodShort)
                )
            ); 
            uint value = ((_balance * percent) / 100)  +_balance;
            Investors[_AccuntsID].PaymentShort.Amount = 0;
            Investors[_AccuntsID].PaymentShort.Time = block.timestamp;
            Investors[_AccuntsID].Balance += value;
            return value;
        }
    }

    function pushShortDeposit(uint amount) public
    {
        uint _AccuntsID = MapAccounst[msg.sender];
        require (_AccuntsID != 0, "No user(");
        require (Investors[_AccuntsID].Balance >= amount, "No money(");

        uint value = getShortDeposit();
        Investors[_AccuntsID].Balance -= amount + value;
        Investors[_AccuntsID].PaymentShort.Amount = amount + value;
        Investors[_AccuntsID].PaymentShort.Time = block.timestamp;
    }

    function updatePeriodTimeShort(uint _newTime) external adminOnly
    {
        PeriodShort = _newTime ;
    }

    function updatePeriodTimeLong(uint _newTime) external adminOnly
    {
        PeriodLong = _newTime;
    }

    function updateSubscriptionTime(uint _AccountID, uint _periodSubscription) public
    {
        require (_AccountID != 0, "No user(");
        uint subscriptionTotal = Accounts[_AccountID].SubscriptionTime + _periodSubscription;
        uint realTime = block.timestamp;

        if (subscriptionTotal < realTime)
        {
            Accounts[_AccountID].Status = subscription(0);
            Accounts[_AccountID].SubscriptionTime = realTime;
        }

    }

    function transferInvestorToAccount(uint amount) external 
    {
        uint _AccuntsID = MapAccounst[msg.sender];
        require (_AccuntsID != 0, "No user(");
        require (Investors[_AccuntsID].Balance >= amount, "No money(");
        Investors[_AccuntsID].Balance -= amount;
        Accounts[_AccuntsID].Balance += amount;
    }

    function transferAccountToInvestor(uint amount) external
    {
        uint _AccuntsID = MapAccounst[msg.sender];
        require (_AccuntsID != 0, "No user(");
        require (Accounts[_AccuntsID].Balance >= amount, "No money(");
        Accounts[_AccuntsID].Balance -= amount;
        Investors[_AccuntsID].Balance += amount;
    }


   function getBalanceAccount() public view returns (uint) 
    {
        uint _AccuntsID = MapAccounst[msg.sender];
        require (_AccuntsID != 0, "No user(");
        return Accounts[_AccuntsID].Balance;
    }
/*
    function getAll() public payable onlyOwner
    {
        address _thisContract = address(this);
        payable(Owner).transfer(_thisContract.balance);
    }
*/
}
