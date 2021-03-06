"use strict";

const fs = require(`fs`).promises;

const chalk = require(`chalk`);

const { getRandomInt, shuffle } = require(`../../utils`);
const { offerType } = require(`./constants`);

const FILE_SENTENCES_PATH = `./data/sentences.txt`;
const FILE_TITLES_PATH = `./data/titles.txt`;
const FILE_CATEGORIES_PATH = `./data/categories.txt`;
const FILE_COMMENTS_PATH = `./data/comments.txt`;

const DescriptionRestrict = {
  MIN: 1,
  MAX: 5,
};

const CategoryRestrict = {
  MIN: 1,
};

const CommentTextRestrict = {
  MIN: 1,
  MAX: 3,
};

const USER_FIRST_NAMES = [
  {
    ru: `Иван`,
    eng: `Ivan`,
  },
  {
    ru: `Петр`,
    eng: `Petr`,
  },
  {
    ru: `Дмитрий`,
    eng: `Dmitry`,
  },
  {
    ru: `Сергей`,
    eng: `Sergei`,
  },
];

const USER_LAST_NAMES = [
  {
    ru: `Иванов`,
    eng: `Ivanov`,
  },
  {
    ru: `Петров`,
    eng: `Petrov`,
  },
  {
    ru: `Абрамов`,
    eng: `Abramov`,
  },
  {
    ru: `Васильев`,
    eng: `Vasiliev`,
  },
];

const PasswordRestrict = {
  MIN: 100000,
  MAX: 999999,
};

const OfferSumRestrict = {
  MIN: 10000,
  MAX: 9999999,
};

const PictureRestrict = {
  MIN: 1,
  MAX: 16,
};

const DAY_IN_MILLISECONDS = 86400000;

const DATE_LIMIT_IN_DAYS = 90;

const NumberOfCommentsInOffer = {
  MIN: 2,
  MAX: 5,
};

const printNumWithLead0 = (number) => (number < 10 ? `0${number}` : number);

const readContent = async (filePath) => {
  let result = [];

  try {
    const content = await fs.readFile(filePath, `utf-8`);

    result = content.split(`\n`).filter(Boolean);
  } catch (error) {
    console.error(chalk.red(error));
  }

  return result;
};

const createRandomDate = () => {
  const date = new Date(
    Date.now() - getRandomInt(0, DAY_IN_MILLISECONDS * DATE_LIMIT_IN_DAYS)
  );

  return date.toLocaleDateString();
};

const createOfferDescription = (sentences) =>
  shuffle(sentences)
    .slice(0, getRandomInt(DescriptionRestrict.MIN, DescriptionRestrict.MAX))
    .join(` `);
const createOfferCategories = (categories) =>
  shuffle(categories).slice(
    0,
    getRandomInt(CategoryRestrict.MIN, categories.length)
  );
const createCommentMessage = (comments) =>
  shuffle(comments)
    .slice(0, getRandomInt(CommentTextRestrict.MIN, CommentTextRestrict.MAX))
    .join(` `);

exports.createUsers = (count) =>
  Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const firstName =
      USER_FIRST_NAMES[getRandomInt(0, USER_FIRST_NAMES.length - 1)];
    const lastName =
      USER_LAST_NAMES[getRandomInt(0, USER_LAST_NAMES.length - 1)];
    const email = `${firstName.eng}_${lastName.eng}_${id}@mail.local`.toLowerCase();
    const password = getRandomInt(PasswordRestrict.MIN, PasswordRestrict.MAX);
    const avatar = `avatar${printNumWithLead0(id)}.jpg`;

    return {
      id,
      firstName: firstName.ru,
      lastName: lastName.ru,
      email,
      password,
      avatar,
    };
  });

exports.createCategories = async () => {
  let categories = [];

  try {
    const categoryNames = await readContent(FILE_CATEGORIES_PATH);

    categories = categoryNames.map((name, index) => {
      const id = index + 1;
      const image = `category${printNumWithLead0(id)}.jpg`;

      return {
        id,
        title: name,
        image,
      };
    });

  } catch (error) {
    console.error(chalk.red(`Can't create categories.`));
  }

  return categories;
};

exports.createOffers = async (count, users) => {
  let offers = [];
  try {
    const titles = await readContent(FILE_TITLES_PATH);
    const sentences = await readContent(FILE_SENTENCES_PATH);
    const types = await Object.values(offerType);

    offers = Array.from({ length: count }, (_, index) => {
      const user = users[getRandomInt(0, users.length - 1)];

      const id = index + 1;
      const title = titles[getRandomInt(0, titles.length - 1)];
      const image = `item${printNumWithLead0(getRandomInt(PictureRestrict.MIN, PictureRestrict.MAX))}.jpg`;
      const sum = Math.round(getRandomInt(OfferSumRestrict.MIN, OfferSumRestrict.MAX) / 100);
      const type = types[getRandomInt(0, types.length - 1)];
      const description = createOfferDescription(sentences);
      const createdDate = createRandomDate();
      const userId = user && user.id;

      return {
        id,
        title,
        image,
        sum,
        type,
        description,
        [`createdDate`]: createdDate,
        [`userId`]: userId,
      };
    });
  } catch (error) {
    console.error(chalk.red(error.message));
    console.error(chalk.red(`Can't create offers.`));
  }

  return offers;
};

exports.createComments = async (users, offers) => {
  let comments = [];

  try {
    const commentMessages = await readContent(FILE_COMMENTS_PATH);

    comments = offers.reduce((offersComments, offer) => {
      const numberOfComments = getRandomInt(
        NumberOfCommentsInOffer.MIN,
        NumberOfCommentsInOffer.MAX
      );
      const currentOfferComments = Array.from(
        { length: numberOfComments },
        (_, index) => {
          const lastOffer = offersComments[offersComments.length - 1];
          const lastIndex = lastOffer ? lastOffer.id : 0;
          const id = lastIndex + index + 1;

          const user = users[getRandomInt(0, users.length - 1)];

          const message = createCommentMessage(commentMessages);
          const createdDate = createRandomDate();
          const userId = user && user.id;

          return {
            id,
            message,
            [`createdDate`]: createdDate,
            [`userId`]: userId,
            [`offerId`]: offer.id,
          };
        }
      );

      return [...offersComments, ...currentOfferComments];
    }, []);
  } catch (error) {
    console.error(chalk.red(`Can't create comments.`));
  }

  return comments;
};

exports.createOffersCategories = (offers, categories) =>
  offers.reduce((offersCategories, offer) => {
    const currentOfferCategories = createOfferCategories(categories).map(
      ({ id }) => ({
        [`offerId`]: offer.id,
        [`categoryId`]: id,
      })
    );

    return [...offersCategories, ...currentOfferCategories];
  }, []);

exports.flattenOffersCategories = (offersCategories) =>
  offersCategories.reduce(
    (offersCategoriesAccumulator, offersCategoriesItem) => {
      const offersCategoriesItemWithSameId = offersCategoriesAccumulator.find(
        ({ offerId }) => offerId === offersCategoriesItem.offerId
      );
      const categoriesIds = offersCategoriesItemWithSameId
        ? offersCategoriesItemWithSameId.categoriesIds
        : [];

      const newCategoriesIds = [
        ...categoriesIds,
        offersCategoriesItem.categoryId,
      ];
      const newOffersCategoriesItem = {
        offerId: offersCategoriesItem.offerId,
        categoriesIds: newCategoriesIds,
      };

      const filteredAccumulator = offersCategoriesItemWithSameId
        ? offersCategoriesAccumulator.filter(
            ({ offerId }) => offerId !== offersCategoriesItem.offerId
          )
        : offersCategoriesAccumulator;

      return [...filteredAccumulator, newOffersCategoriesItem];
    },
    []
  );
