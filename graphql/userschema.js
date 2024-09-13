import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    password: String
    role: String
    picture: String
  }

  type UserResponse {
    user: User
    token: String
  }

  type Query {
    getUsers: [User]
    getUser(id: ID!): User
  }

  type Mutation {
    addUser(name: String!, email: String!, password: String!, role: String, picture: String): AuthPayload
    loginUser(email: String!, password: String!): AuthPayload
    updateUser(id: ID!, name: String, email: String, password: String, role: String): User
    deleteUser(id: ID!): String
    updateProfilePicture(id: ID!, picture: String!): User  
    deleteProfilePicture(id: ID!): User                     
  }

  type AuthPayload {
    user: User
    token: String
  }
`;
