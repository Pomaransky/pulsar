import { User } from "./user.model";

export interface EditForm extends Required<Pick<User, 'firstName' | 'lastName' | 'aboutMe'>> {
  birthDate: Date | null;
}