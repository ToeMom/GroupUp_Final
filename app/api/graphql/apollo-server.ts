/* eslint-disable @typescript-eslint/no-unused-vars */

import { ApolloServer, ApolloServerOptionsWithTypeDefs } from '@apollo/server';
import { DecodedIdToken } from 'firebase-admin/auth';
import { gql } from 'graphql-tag';

import { getCollection } from '../../../lib2/db';


const typeDefs = gql`
  type Categories {
    id: ID!
    name: String!
  }

  type Event {
    id: ID!
    category: String
    ageMax: Int
    ageMin: Int
    createdBy: String
    createdDate: String
    createdTime: String
    date: String
    time: String
    description: String
    image: String
    location: Locations
    maxParticipants: Int
    participants: [String]
    title: String
    reviewedBy: String
    reviewedAt: String
    reason: String
  }

  type User {
  id: ID!
  ID_Answer: [String]
  ID_Question: [String]
  ID_createdEvents: [String]
  age: Int
  name: String
  email: String
  notificationsEnabled: Boolean
  participateEvents: [String]
  profileImage: String
  rating: Float
  admin: Boolean
  moderator: Boolean
  lastProfileUpdate: String
}

type Locations {
  label: String
  name: String
  location: String
  lat: Float
  lon: Float
  zip: String
  regionalStructure: [RegionalStructure]
}

type RegionalStructure {
  name: String
  type: String
}

type Comment {
    id: ID!
    eventId: ID!
    userId: ID!
    username: String!
    text: String!
    createdAt: String!
    parentCommentId: ID
  }


input LocationInput {
  label: String
  name: String
  location: String
  lat: Float
  lon: Float
  zip: String
  regionalStructure: [RegionalStructureInput]
}

input RegionalStructureInput {
  name: String
  type: String
}

  type Query {
    getAllEvents: [Event!]!
    getCategories: [Categories!]!
    getEvents(limit: Int, offset: Int): [Event!]!
    getEventById(id: ID!): Event
    getUsers: [User!]!
    getUserById(id: ID!): User
    getEventsByUser(userId: ID!): [Event!]!
    getCommentsByEvent(eventId: ID!): [Comment!]!
    getReplies(commentId: ID!): [Comment!]!
    getWaitingEvents: [Event!]!
    getWaitingEventsByUser(userId: ID!): [Event!]!
    getRejectedEventsByUser(userId: ID!): [Event!]!
  }

  input EventInput {
    category: String
    ageMax: Int
    ageMin: Int
    createdBy: String
    date: String
    time: String
    description: String
    image: String
    location: LocationInput
    maxParticipants: Int
    participants: [String]
    title: String
}


  input UserInput {
  ID_Answer: [String]
  ID_Question: [String]
  UID: String
  ID_createdEvents: [String]
  age: Int
  name: String
  notificationsEnabled: Boolean
  participateEvents: [String]
  profileImage: String
  email: String
  rating: Float
  admin: Boolean
  moderator: Boolean
}

    input CommentInput {
    eventId: ID!
    username: String!
    text: String!
    parentCommentId: ID
  }

  type Mutation {
    rejectEvent(eventId: ID!, reason: String): Boolean
    addComment(comment: CommentInput!): Comment
    addEvent(event: EventInput!): Event
    deleteEvent(id: ID!): Boolean
    addUser(user: UserInput!): User
    addParticipantToEvent(eventId: ID!): Event
    removeParticipantFromEvent(eventId: ID!): Event
    updateUser(userId: ID!, user: UserInput!): User
    deleteUser(userId: ID!): Boolean
    updateEvent(eventId: ID!, event: EventInput!): Event
    deleteComment(commentId: ID!): Boolean
    approveEvent(eventId: ID!): Event
    assignModeratorRole(userId: ID!): User
    addCategory(name: String!): Categories
    removeModeratorRole(userId: ID!): User
    removeCategory(categoryId: ID!): Boolean
    deleteRejectedEvent(id: ID!): Boolean
    expiredEvent(id: ID!): Boolean
  }
`;

type Categories = {
  id: string;
  name: string;
}

type Event = {
  id: string;
  category: string;
  ageMax: number;
  ageMin: number;
  createdBy: string;
  createdDate: string;
  createdTime: string;
  date: string;
  time: string;
  description: string;
  image: string;
  location: string;
  maxParticipants: number;
  participants: string[];
  title: string;
  reviewedBy: string;
  reviewedAt: string;
  reason: string;
};

type User = {
  id: string;
  ID_Answer: string[];
  ID_Question: string[];
  ID_createdEvents: string[];
  age: number;
  name: string;
  email: string;
  notificationsEnabled: boolean;
  participateEvents: string[];
  profileImage: string;
  rating: number;
  admin: boolean;
  moderator: boolean;
  lastProfileUpdate?: string;
};

type Comment = {
  id: string;
  eventId: string;
  username: string;
  userId: string;
  text: string;
  createdAt: string;
  parentCommentId?: string;
};

type FbDoc<T extends { id: string }> = Omit<Event, 'id'>;
type FbDoc2<T extends { id: string }> = Omit<User, 'id'>;
type FbDoc3<T extends { id: string }> = Omit<Categories, 'id'>;
type FbDoc4<T extends { id: string }> = Omit<Comment, 'id'>;
const resolvers: ApolloServerOptionsWithTypeDefs<MyContext>['resolvers'] = {
  Query: {
    getCommentsByEvent: async (_, { eventId }) => {
      const query = getCollection<FbDoc4<Comment>>('Comments')
        .where('eventId', '==', eventId)
        .where('parentCommentId', '==', null); 
      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      return data;
    },
    getReplies: async (_, { commentId }) => {
      const query = getCollection<FbDoc4<Comment>>('Comments').where('parentCommentId', '==', commentId);
      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      return data;
    },
    getCategories: async () => {
      const query = getCollection<FbDoc3<Categories>>('Category')
      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      console.log('data', data);

      return data;
    },
    getAllEvents: async () => {
      const query = getCollection<FbDoc<Event>>('Events')
      const snapshot = await query.get();
       const data = snapshot.docs.map((doc) => {
         return { id: doc.id, ...doc.data() };
       });
       console.log('data', data);
 
       return data;
     },
    getEvents: async (_, { limit, offset}) => {
      const query = getCollection<FbDoc<Event>>('Events')
        .orderBy('date')
        .limit(limit)
        .offset(offset);

      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      return data;
    },
    getEventById: async (_, { id }) => {
      const query = getCollection<FbDoc<Event>>('Events').doc(id);
      const doc = await query.get();

      if (!doc.exists) {
        throw new Error('Event not found');
      }

      const data = { id: doc.id, ...doc.data() };
      console.log('data', data);

      return data;
    },
    getEventsByUser: async (_, { userId }, context) => {
      const createdEventsQuery = getCollection<FbDoc<Event>>('Events').where('createdBy', '==', userId);
      const createdSnapshot = await createdEventsQuery.get();

      const createdEvents = createdSnapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      return createdEvents;
    },

    getUsers: async (_, __, context) => {
      const query = getCollection<FbDoc2<User>>('Users')
      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      console.log('data', data);

      return data;
    },
    getRejectedEventsByUser: async (_, { userId }, context) => {
      const query = getCollection<FbDoc<Event>>('RejectedEvents').where('createdBy', '==', userId);
      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      return data;
    },
    getUserById: async (_, { id }) => {
      const query = getCollection<FbDoc2<User>>('Users').doc(id);
      const doc = await query.get();

      if (!doc.exists) {
        throw new Error('User not found');
      }

      const data = { id: doc.id, ...doc.data() };
      console.log('data', data);

      return data;
    },
    getWaitingEvents: async (_, __, context) => {
      const userId = context.user?.uid;

      if (!userId) {
        throw new Error('User must be authenticated to view waiting events.');
      }

      const query = getCollection<FbDoc<Event>>('WaitingEvents');
      const snapshot = await query.get();

      const data = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      return data;
    },
    getWaitingEventsByUser: async (_, { userId }, context) => {
      if (!userId) {
        throw new Error('User must be authenticated to view waiting events.');
      }

      const query = getCollection<FbDoc<Event>>('WaitingEvents').where('createdBy', '==', userId);
      const snapshot = await query.get();

      const data = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      return data;
    },
    
  },
  Mutation: {
    addEvent: async (_, { event }, context) => {
      const createdBy = context.user?.uid || '';

      const now = new Date();
      const createdDate = now.toLocaleDateString('en-GB');
      const createdTime = now.toLocaleTimeString('en-GB');

      const newEventRef = await getCollection<FbDoc<Event>>('WaitingEvents').add({
        ...event,
        createdBy,
        createdDate,
        createdTime,
        participants: event.participants || [],
      });

      const newEventSnapshot = await newEventRef.get();
      const newEventData = newEventSnapshot.data();

      if (!newEventData) throw new Error('Failed to retrieve the newly added event');
      return { id: newEventRef.id, ...newEventData };
    },

    approveEvent: async (_, { eventId }, context) => {
      const userId = context.user?.uid;
    
      if (!userId) {
        throw new Error('User must be authenticated to approve an event.');
      }
    
      const waitingEventRef = getCollection<FbDoc<Event>>('WaitingEvents').doc(eventId);
      const waitingEventSnapshot = await waitingEventRef.get();
    
      if (!waitingEventSnapshot.exists) {
        throw new Error('Event not found in WaitingEvents.');
      }
    
      const waitingEventData = waitingEventSnapshot.data();
    
      if (!waitingEventData) {
        throw new Error('Failed to retrieve event data from WaitingEvents.');
      }
    
      const approvedEventData = {
        ...waitingEventData,
        approvedBy: userId,
        approvedAt: new Date().toISOString(),
      };
    
      const approvedEventRef = await getCollection<FbDoc<Event>>('Events').add(approvedEventData);
    
      await waitingEventRef.delete();
    
      const approvedEventSnapshot = await approvedEventRef.get();
      const finalApprovedEventData = approvedEventSnapshot.data();
    
      if (!finalApprovedEventData) {
        throw new Error('Failed to retrieve the approved event data.');
      }
    
      return { id: approvedEventRef.id, ...finalApprovedEventData };
    },    
    addUser: async (_, { user }, context) => {
      const uid = context.user?.uid;
    
      if (!uid) {
        throw new Error('User must be authenticated to add a user profile.');
      }
    
      const userRef = getCollection<FbDoc2<User>>('Users').doc(uid);
    
      await userRef.set({
        ...user,
        admin: false,
        moderator: false,
      });
    
      const userSnapshot = await userRef.get();
      const userData = userSnapshot.data();
    
      if (!userData) throw new Error('Failed to retrieve the newly added user');
    
      return { id: uid, ...userData };
    },
    rejectEvent: async (_, { eventId, reason }, context) => {
      const userId = context.user?.uid;
    
      if (!userId) {
        throw new Error('User must be authenticated to reject an event.');
      }
    
      
      const waitingEventRef = getCollection<FbDoc<Event>>('WaitingEvents').doc(eventId);
      const waitingEventSnapshot = await waitingEventRef.get();
    
      if (!waitingEventSnapshot.exists) {
        throw new Error('Event not found in WaitingEvents.');
      }
    
      const waitingEventData = waitingEventSnapshot.data();
    
      if (!waitingEventData) {
        throw new Error('Failed to retrieve event data from WaitingEvents.');
      }
    
      const rejectedLogRef = getCollection<FbDoc<Event>>('RejectedEvents');
      await rejectedLogRef.add({
        ...waitingEventData,
        reviewedBy: userId,
        reviewedAt: new Date().toISOString(),
        reason: reason
      });
    
      await waitingEventRef.delete();
    
      return true;
    },
    
    deleteEvent: async (_, { id }, context) => {
      const uid = context.user?.uid;
    
      const eventRef = getCollection<FbDoc<Event>>('Events').doc(id);
      const eventSnapshot = await eventRef.get();
    
      if (!eventSnapshot.exists) {
        throw new Error('Event not found.');
      }
    
      const eventData = eventSnapshot.data();
    
      const commentsQuery = getCollection<FbDoc4<Comment>>('Comments').where('eventId', '==', id);
      const commentsSnapshot = await commentsQuery.get();
    
      const deleteCommentsPromises = commentsSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deleteCommentsPromises);
    
      await eventRef.delete();
    
      return true;
    },
    expiredEvent: async (_, { id }) => {
      const eventRef = getCollection<FbDoc<Event>>('Events').doc(id);
      const eventSnapshot = await eventRef.get();

      if (!eventSnapshot.exists) {
        throw new Error('Event not found.');
      }

      const eventData = eventSnapshot.data();

      if (!eventData) {
        throw new Error('Failed to retrieve event data.');
      }

      await eventRef.delete();
      return true;
    },
    addParticipantToEvent: async (_, { eventId }, context) => {
      const userId = context.user?.uid;

      if (!userId) {
        throw new Error('User must be authenticated to join an event.');
      }

      const eventRef = getCollection<FbDoc<Event>>('Events').doc(eventId);
      const eventSnapshot = await eventRef.get();

      if (!eventSnapshot.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventSnapshot.data();

      if (!eventData) {
        throw new Error('Failed to retrieve event data');
      }

      if (eventData.participants?.includes(userId)) {
        throw new Error('User is already a participant in this event.');
      }

      const updatedParticipants = [...(eventData.participants || []), userId];

      await eventRef.update({ participants: updatedParticipants });

      const updatedEventSnapshot = await eventRef.get();
      const updatedEventData = updatedEventSnapshot.data();

      if (!updatedEventData) {
        throw new Error('Failed to retrieve updated event data');
      }

      return { id: eventRef.id, ...updatedEventData };
    },
    updateUser: async (_, { userId, user }, context) => {
      const uid = context.user?.uid;
    
      if (!uid) {
        throw new Error('Uživatel musí být přihlášen, aby mohl aktualizovat svůj profil.');
      }
    
      const userRef = getCollection<FbDoc2<User>>('Users').doc(userId);
      const userSnapshot = await userRef.get();
    
      const now = new Date().toISOString();
      await userRef.update({
        ...user,
        lastProfileUpdate: now,
      });
    
      const updatedUserSnapshot = await userRef.get();
      const updatedUserData = updatedUserSnapshot.data();
    
      if (!updatedUserData) {
        throw new Error('Nepodařilo se načíst aktualizovaná data uživatele.');
      }
    
      return { id: userId, ...updatedUserData };
    },
    updateEvent: async (_, { eventId, event }, context) => {
      const uid = context.user?.uid;

      if (!uid) {
        throw new Error('User must be authenticated to update an event.');
      }

      const eventRef = getCollection<FbDoc<Event>>('Events').doc(eventId);
      const eventSnapshot = await eventRef.get();

      if (!eventSnapshot.exists) {
        throw new Error('Event not found.');
      }

      const eventData = eventSnapshot.data();

      if (!eventData) {
        throw new Error('Failed to retrieve event data.');
      }

      
      await eventRef.update({ ...event });

      const updatedEventSnapshot = await eventRef.get();
      const updatedEventData = updatedEventSnapshot.data();

      if (!updatedEventData) {
        throw new Error('Failed to retrieve updated event data.');
      }

      return { id: eventRef.id, ...updatedEventData };
    },
    removeParticipantFromEvent: async (_, { eventId }, context) => {
      const userId = context.user?.uid;

      if (!userId) {
        throw new Error('User must be authenticated to leave an event.');
      }

      const eventRef = getCollection<FbDoc<Event>>('Events').doc(eventId);
      const eventSnapshot = await eventRef.get();

      if (!eventSnapshot.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventSnapshot.data();

      if (!eventData) {
        throw new Error('Failed to retrieve event data');
      }

      
      if (!eventData.participants?.includes(userId)) {
        throw new Error('User is not a participant in this event.');
      }

      
      const updatedParticipants = eventData.participants.filter(
        (participant) => participant !== userId
      );

      await eventRef.update({ participants: updatedParticipants });

      const updatedEventSnapshot = await eventRef.get();
      const updatedEventData = updatedEventSnapshot.data();

      if (!updatedEventData) {
        throw new Error('Failed to retrieve updated event data');
      }

      return { id: eventRef.id, ...updatedEventData };
    },
    addComment: async (_, { comment }, context) => {
      const userId = context.user?.uid;

      if (!userId) {
        throw new Error('User must be authenticated to add a comment.');
      }

      const now = new Date();
      const createdAt = now.toISOString();

      const newCommentRef = await getCollection<FbDoc4<Comment>>('Comments').add({
        ...comment,
        userId,
        createdAt,
      });

      const newCommentSnapshot = await newCommentRef.get();
      const newCommentData = newCommentSnapshot.data();

      if (!newCommentData) throw new Error('Failed to retrieve the newly added comment');
      return { id: newCommentRef.id, ...newCommentData };
    },
    deleteComment: async (_, { commentId }, context) => {
      const userId = context.user?.uid;

      if (!userId) {
        throw new Error('User must be authenticated to delete a comment.');
      }

      const commentRef = getCollection<FbDoc4<Comment>>('Comments').doc(commentId);
      const commentSnapshot = await commentRef.get();

      if (!commentSnapshot.exists) {
        throw new Error('Comment not found.');
      }

      const commentData = commentSnapshot.data();

      await commentRef.delete();
      return true;
    },
    assignModeratorRole: async (_, { userId }, context) => {
      const adminId = context.user?.uid;
  
      if (!adminId) {
        throw new Error('User must be authenticated to assign moderator role.');
      }
  
      const adminRef = getCollection<FbDoc2<User>>('Users').doc(adminId);
      const adminSnapshot = await adminRef.get();
  
      if (!adminSnapshot.exists) {
        throw new Error('Admin not found.');
      }
  
      const adminData = adminSnapshot.data();
  
      if (!adminData?.admin) {
        throw new Error('Only admins can assign moderator role.');
      }
  
      const userRef = getCollection<FbDoc2<User>>('Users').doc(userId);
      const userSnapshot = await userRef.get();
  
      if (!userSnapshot.exists) {
        throw new Error('User not found.');
      }
  
      await userRef.update({ moderator: true });
  
      const updatedUserSnapshot = await userRef.get();
      const updatedUserData = updatedUserSnapshot.data();
  
      if (!updatedUserData) {
        throw new Error('Failed to retrieve the updated user data.');
      }
  
      return { id: userId, ...updatedUserData };
    },
    addCategory: async (_, { name }, context) => {
      const adminId = context.user?.uid;
  
      if (!adminId) {
        throw new Error('User must be authenticated to add a category.');
      }
  
      const adminRef = getCollection<FbDoc2<User>>('Users').doc(adminId);
      const adminSnapshot = await adminRef.get();
  
      if (!adminSnapshot.exists) {
        throw new Error('Admin not found.');
      }
  
      const adminData = adminSnapshot.data();
  
      if (!adminData?.admin) {
        throw new Error('Only admins can add categories.');
      }
  
      const newCategoryRef = await getCollection<FbDoc3<Categories>>('Category').add({ name });
  
      const newCategorySnapshot = await newCategoryRef.get();
      const newCategoryData = newCategorySnapshot.data();
  
      if (!newCategoryData) {
        throw new Error('Failed to retrieve the newly added category.');
      }
  
      return { id: newCategoryRef.id, ...newCategoryData };
    },
    removeModeratorRole: async (_, { userId }, context) => {
      const adminId = context.user?.uid;

      if (!adminId) {
        throw new Error('User must be authenticated to remove moderator role.');
      }

      const adminRef = getCollection<FbDoc2<User>>('Users').doc(adminId);
      const adminSnapshot = await adminRef.get();

      if (!adminSnapshot.exists) {
        throw new Error('Admin not found.');
      }

      const adminData = adminSnapshot.data();

      if (!adminData?.admin) {
        throw new Error('Only admins can remove moderator role.');
      }

      const userRef = getCollection<FbDoc2<User>>('Users').doc(userId);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        throw new Error('User not found.');
      }

      await userRef.update({ moderator: false });

      const updatedUserSnapshot = await userRef.get();
      const updatedUserData = updatedUserSnapshot.data();

      if (!updatedUserData) {
        throw new Error('Failed to retrieve the updated user data.');
      }

      return { id: userId, ...updatedUserData };
    },
    removeCategory: async (_, { categoryId }, context) => {
      const adminId = context.user?.uid;

      if (!adminId) {
        throw new Error('User must be authenticated to remove a category.');
      }

      const adminRef = getCollection<FbDoc2<User>>('Users').doc(adminId);
      const adminSnapshot = await adminRef.get();

      if (!adminSnapshot.exists) {
        throw new Error('Admin not found.');
      }

      const adminData = adminSnapshot.data();

      if (!adminData?.admin) {
        throw new Error('Only admins can remove categories.');
      }

      const categoryRef = getCollection<FbDoc3<Categories>>('Category').doc(categoryId);
      const categorySnapshot = await categoryRef.get();

      if (!categorySnapshot.exists) {
        throw new Error('Category not found.');
      }

      await categoryRef.delete();
      return true;
    },
    deleteUser: async (_, { userId }, context) => {
      const query = getCollection<FbDoc2<User>>('Users').doc(userId);
      const doc = await query.get();

      if (!doc.exists) {
        throw new Error('User not found');
      }

      await query.delete()

      return true;
    },
    deleteRejectedEvent: async (_, { id }, context) => {
      const userId = context.user?.uid;

      if (!userId) {
        throw new Error('User must be authenticated to delete a rejected event.');
      }

      const rejectedEventRef = getCollection<FbDoc<Event>>('RejectedEvents').doc(id);
      const rejectedEventSnapshot = await rejectedEventRef.get();

      if (!rejectedEventSnapshot.exists) {
        throw new Error('Rejected event not found.');
      }

      const rejectedEventData = rejectedEventSnapshot.data();

      if (!rejectedEventData) {
        throw new Error('Failed to retrieve rejected event data.');
      }

      await rejectedEventRef.delete();
      return true;
    },


  }
};

export type MyContext = {
  user: undefined | DecodedIdToken;
};

export const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});