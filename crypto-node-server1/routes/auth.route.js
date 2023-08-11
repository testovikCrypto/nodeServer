const express = require('express');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');
const WalletsNew = require('../models/wallets-new.model')
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Deal = require("../models/deal.model");
const Admin = require("../models/admin.model");
// const storage = multer.diskStorage()
// const upload = multer();
const cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name: 'dgapdz84b',
    api_key: '777432719576594',
    api_secret: 'aWl8z9OmB3AtM-49jNJm8iVo27Y'
});
// multer setup
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const Events = require("../models/event.model");

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: '387c83b323f60d80129bc2d748bdacfd-07ec2ba2-b2b37e4a',
});

const router = express.Router();

router.post('/confirmEmail', async (req, res) => {
    const {sClientEmail} = req.body;
    let code = Math.floor(100000 + Math.random() * 900000);

    try {
        mg.messages.create('sandbox20da65cba70c452eb4f5c822f6d36982.mailgun.org', {
            from: "Mailgun Sandbox <postmaster@sandbox20da65cba70c452eb4f5c822f6d36982.mailgun.org>",
            to: [sClientEmail],
            subject: 'Confirmation Code',
            text: `Your confirmation code is: ${code}`,
        })
            .then(msg => {
                console.log(msg); // logs response data
                return res.json({sSecret: code});
            })
            .catch(err => {
                console.log(err); // logs any error
                return res.status(500).json({message: err.message});
            });
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
});

router.post('/register', async (req, res) => {
    const {sName, sSurname, sEmail, sNumber, sPassword, sDateTime_Registered} = req.body;

    try {
        const existingUser = await User.findOne({sEmail});
        if (existingUser) {
            return res.json({message: 'User already exists'});
        }

        const newUser = new User({
            sName,
            sSurname,
            sEmail,
            sNumber,
            sPassword,
            sDateTime_Registered,
            sBalance: '0',
            sVerificationConfirmed: 'false',
            bVerificationDocumentsSubmitted: false
        });
        await newUser.save();

        const token = jwt.sign({id: newUser._id}, 'yegizavrus', {expiresIn: '1h'});

        return res.json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.sEmail,
            },
        });
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
});

router.post('/login', async (req, res) => {
    const {sEmail, sPassword} = req.body;

    try {
        const user = await User.findOne({sEmail});
        if (!user) {
            return res.json({message: 'User not found'});
        }

        let isMatch;
        if (user.sPassword.startsWith('$2a$')) {
            isMatch = await user.comparePassword(sPassword);
        } else {
            isMatch = user.sPassword === sPassword;
        }

        if (!isMatch) {
            return res.json({message: 'Invalid credentials'});
        }

        const token = jwt.sign({id: user._id}, 'yegizavrus', {expiresIn: '1h'});

        return res.json({
            message: 'User logged in successfully',
            token,
            user: {
                id: user._id,
                username: user.sEmail,
            },
        });
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
});

router.post('/loginAdmin', async (req, res) => {
    const {sEmail, sPassword} = req.body;

    try {
        const admin = await Admin.findOne({sEmail});
        if (!admin) {
            return res.json({message: 'User not found'});
        }

        const isMatch = admin.sPassword === sPassword;

        if (!isMatch) {
            return res.json({message: 'Invalid credentials'});
        }

        const token = jwt.sign({id: admin._id}, 'yegizavrus', {expiresIn: '1h'});

        return res.json({
            message: 'User logged in successfully',
            token,
            user: {
                id: admin._id,
                username: admin.sEmail,
            },
        });
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
});

router.get('/user/:id', async (req, res) => {
    try {
        const {id} = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.json({message: 'User not found'});
        }

        res.status(200).json({user});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.find({});

        if (!users) {
            return res.status(404).json({message: 'No users found'});
        }

        const usersData = users.map(user => user.toJSON());
        res.status(200).json({users: usersData});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.put('/user/:id/balance', async (req, res) => {
    try {
        const {id} = req.params;
        const {sBalance} = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            {$set: {sBalance: sBalance}},
            {new: true} // Возвращает обновленный документ
        );

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json({
            user: {
                id: user._id,
                sName: user.sName,
                sSurname: user.sSurname,
                sEmail: user.sEmail,
                sNumber: user.sNumber,
                sBalance: user.sBalance
            },
        });
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.put('/user/:id/addBalanceDemo', async (req, res) => {
    try {
        const {id} = req.params;
        const {sBalance_Demo} = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            {$set: {sBalance_Demo: sBalance_Demo}},
            {new: true} // Возвращает обновленный документ
        );

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json({user});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.put('/user/:id/demo', async (req, res) => {
    try {
        const {id} = req.params;
        const {bDemoAccount} = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            {$set: {bDemoAccount: bDemoAccount}},
            {new: true} // Возвращает обновленный документ
        );

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json({user});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.put('/user/:id/verification', upload.array('documents'), async (req, res) => {
    try {
        const {id} = req.params;
        const oVerificationDocuments = req.files;

        const imagePromises = oVerificationDocuments.map(file => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {resource_type: 'auto'},
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result.url);
                        }
                    }
                );

                uploadStream.end(file.buffer);
            });
        });

        const imageLinks = await Promise.all(imagePromises);

        const user = await User.findByIdAndUpdate(
            id,
            {
                $set: {
                    oVerificationDocuments: imageLinks,
                    bVerificationDocumentsSubmitted: true,
                    sVerificationConfirmed: 'pending'
                }
            },
            {new: true}
        );

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.put('/user/:id/photo', upload.array('documents'), async (req, res) => {
    try {
        const {id} = req.params;
        const userImage = req.files[0]; // Здесь будет файл

        let imageLink;
        if (userImage) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {resource_type: 'auto'},
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            imageLink = result.url;
                            resolve(result.url);
                        }
                    }
                );

                uploadStream.end(userImage.buffer);
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            {
                $set: {
                    sProfilePhoto: imageLink
                }
            },
            {new: true}
        );

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json({user});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.put('/user/:id/verified', async (req, res) => {
    try {
        const {id} = req.params;
        const {sVerificationConfirmed} = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            {$set: {sVerificationConfirmed: sVerificationConfirmed}},
            {new: true} // Возвращает обновленный документ
        );

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json({bVerified: true});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.get('/actualReplenishWallets', async (req, res) => {
    try {
        const wallets = await Wallet.find();

        if (!wallets) {
            return res.status(404).json({message: 'No wallets found'});
        }

        res.status(200).json({wallets: wallets});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get('/users/:id/events', async (req, res) => {
    const {id} = req.params;

    try {
        const events = await Events.find({
            userID: id
        })

        res.status(200).json({events});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get('/events', async (req, res) => {
    try {
        const events = await Events.find({})

        res.status(200).json({events});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get('/events/filteredByMonth', async (req, res) => {
    try {
        var events = await Events.find({});

        const mEventsFilteredByMonth = events.reduce((acc, obj) => {
            const date = new Date(obj.sDateTime);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`; // Год и месяц, месяцы начинаются с 0, поэтому добавляем 1

            if (!acc.has(key)) {
                acc.set(key, []); // Если нет записей для этого месяца, инициализируем пустым массивом
            }

            acc.get(key).push(obj); // Добавляем объект в массив этого месяца

            return acc;
        }, new Map());

        res.status(200).json({mEventsFilteredByMonth: Object.fromEntries(mEventsFilteredByMonth)});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get('/eventConfirm/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const event = await Events.findByIdAndUpdate(
            id,
            {
                $set: {
                    sConfirmed: 'true',
                    bCompleted: true
                }
            },
            {new: true}
        )

        if (event.sKey_Type === 'replenish') {
            const findUser = await User.findById(event.userID);

            const updatedUser = await User.findByIdAndUpdate(
                event.userID,
                {
                    $set: {
                        sBalance: (Number(findUser.sBalance) + event.nSum).toFixed(2)
                    }
                },
                {new: true}
            )

            if (!updatedUser) {
                return res.status(404).json({message: 'Could not find user'});
            }
        }

        if (!event) {
            return res.status(404).json({message: 'Event not found'});
        }

        res.status(200).json({event});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get('/eventDeny/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const event = await Events.findByIdAndUpdate(
            id,
            {
                $set: {
                    sConfirmed: 'false',
                    bCompleted: true
                }
            },
            {new: true}
        )

        if (event.sKey_Type === 'withdraw') {
            const findUser = await User.findById(event.userID);

            const updatedUser = await User.findByIdAndUpdate(
                event.userID,
                {
                    $set: {
                        sBalance: (Number(findUser.sBalance) + event.nSum).toFixed(2)
                    }
                },
                {new: true}
            )

            if (!updatedUser) {
                return res.status(404).json({message: 'Could not find user'});
            }

        }

        if (!event) {
            return res.status(404).json({message: 'Event not found'});
        }

        res.status(200).json({event});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

/*router.put('/user/:id/replenish', async (req, res) => {
  try {
    const {id} = req.params;
    const {nReplenishAmount} = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          nReplenishAmount: nReplenishAmount
        }
      },
      {new: true}
    );

    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    res.status(200).json({bReplenishRequestSent: true});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
})*/

/*router.put('/user/:id/withdraw', async (req, res) => {
  try {
    const {id} = req.params;
    const {nWithdrawAmount, sWallet} = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          nWithdrawAmount: nWithdrawAmount,
          sWithdrawWallet: sWallet
        }
      },
      {new: true}
    );

    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    res.status(200).json({bReplenishRequestSent: true});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
})*/

router.put('/actualReplenishWallets/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {sCoin, sNetwork, newAddress} = req.body;

        let setKeyParam = 'oWallets.' + sCoin + '.' + sNetwork
        const wallet = await Wallet.findByIdAndUpdate(
            id,
            {"$set": {[setKeyParam]: newAddress}},
            {new: true} // Возвращает обновленный документ
        );

        if (!wallet) {
            return res.status(404).json({message: 'Wallet not found'});
        }

        res.status(200).json(wallet);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.put('/editWallet/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {newAddress} = req.body;

        const wallet = await WalletsNew.findByIdAndUpdate(
            id,
            {"$set": {sWallet: newAddress}},
            {new: true}
        );

        res.status(200).json(wallet);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get('/deleteWallet/:id', async (req, res) => {
    const {id} = req.params;

    try {
        await WalletsNew.findByIdAndRemove(id);
        res.status(200).json({bRemoved: true})
    } catch (err) {
        res.status(500).json({bRemoved: false, message: err.message})
    }
})

router.post('/setWallet', async (req, res) => {
    try {
        const {sCurrency, sNetwork, sWallet, sPrivateKey, bMainWallet} = req.body;

        const wallet = await WalletsNew({
            sCurrency,
            sNetwork,
            sWallet,
            sPrivateKey,
            bMainWallet
        });

        await wallet.save();

        res.status(200).json(wallet);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.get('/getWallets/:bMainWallet', async (req, res) => {
    try {
        const {bMainWallet} = req.params;

        const wallet = await WalletsNew.find(
            {bMainWallet: bMainWallet === 'true'}
        );

        if (!wallet) {
            return res.status(404).json({message: 'Wallet not found'});
        }

        res.status(200).json(wallet);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.get('/getGatewayReplenishWalletsFiltered', async (req, res) => {
    try {
        const aWallets = await WalletsNew.aggregate([
            { $match: { bMainWallet: false } },
            { $group: { _id: '$sNetwork', wallets: { $push: '$$ROOT' } } }
        ]);

        if (!aWallets || aWallets.length === 0) {
            return res.status(404).json({message: 'Wallets not found'});
        }

        // Преобразование результата в массив случайных кошельков для каждой сети
        const wallets = aWallets.map(group => {
            const randomIndex = Math.floor(Math.random() * group.wallets.length);
            return group.wallets[randomIndex];
        });

        return res.json(wallets);
    } catch (error) {
        console.error('Error fetching wallets:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
});


// Получение активных сделок для пользователя
router.get('/users/:userId/activeDeals', async (req, res) => {
    try {
        const deals = await Deal.find({userID: req.params.userId, dealStatus: 'active'});
        res.status(200).json(deals);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// Получение закрытых сделок для пользователя
router.get('/users/:userId/closedDeals', async (req, res) => {
    // const {bDemoAccount} = req.body;

    try {
        const deals = await Deal.find({userID: req.params.userId, dealStatus: 'closed', bDemoAccount: false});
        res.status(200).json(deals);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

module.exports = router;
