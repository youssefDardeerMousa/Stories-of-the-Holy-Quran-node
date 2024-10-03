import { gql } from 'apollo-server-express';

export const typeDefsProphets = gql`
  type Video {
    id: ID!
    prophet_name: String!
    video_title: String!
    video_link: String!
  }

  type VideoPagination {
    videos: [Video!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type Query {
    getVideos(page: Int, limit: Int): VideoPagination!
    getVideo(id: ID!): Video
  }

  type Mutation {
    createVideo(prophet_name: String!, video_title: String!, video_link: String!): Video
    updateVideo(id: ID!, prophet_name: String, video_title: String, video_link: String): Video
    deleteVideo(id: ID!): Boolean
  }
`;
