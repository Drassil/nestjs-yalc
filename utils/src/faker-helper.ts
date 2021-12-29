import * as faker from 'faker';

// TODO: Probably we can use the internal faker of typeorm-seeding to create uniqueness, like we do here
// (mentioned in https://github.com/w3tecch/typeorm-seeding/issues/98#issuecomment-849585576)

export const DEF_FAKER_MAX_RETRIES = 1500;
export const DEF_FAKER_MAX_TIME = 250;

export class FakerHelper {
  // We could also create a new email from the same person,
  // however we assume when this function is called we actually want a different person.
  createPerson() {
    const gender = faker.datatype.number(1);
    const firstName = faker.name.firstName(gender);
    const lastName = faker.name.lastName(gender);

    return {
      gender,
      firstName,
      lastName,
      email: this.generateNewEmail(firstName, lastName, 'gmail.test'),
    };
  }

  generateNewEmail(firstName: string, lastName: string, provider?: string) {
    return faker.unique(faker.internet.email, [firstName, lastName, provider], {
      maxRetries: DEF_FAKER_MAX_RETRIES,
      maxTime: DEF_FAKER_MAX_TIME,
    });
  }

  randomFromEnum<T>(inputEnum: T): T[keyof T] {
    const randInt = faker.datatype.number(Object.keys(inputEnum).length - 1);
    return inputEnum[Object.keys(inputEnum)[randInt] as keyof typeof inputEnum];
  }

  randomDecimal = (min: number, max: number, precision: number): string => {
    return faker.datatype
      .float({ precision: precision, min: min, max: max })
      .toString();
  };

  // Creates a random birthdate for people between 18-100 years of age.
  // Date is returned in format YYYY-MM-DD
  randomBirthDate = () => {
    const birthDate = faker.date.past(82);
    birthDate.setFullYear(birthDate.getFullYear() - 18);
    const [mm, dd, yyyy] = birthDate.toLocaleString().split(',')[0].split('/');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Returns one of three values:
  // * a date in the past (expired lock)
  // * a date in the future (locked till then)
  // * null (db)/undefined (in code) (no locks)
  randomLockDate = () => {
    const random = faker.datatype.number(2);
    if (random === 0) {
      return faker.date.past(3);
    } else if (random === 1) {
      return faker.date.future(1);
    } else {
      return undefined;
    }
  };
}
