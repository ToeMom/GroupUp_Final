import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const createApp = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require('../firebase.config.json')
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

export const getApp = () => {
  try {
    admin.instanceId();
  } catch {
    createApp();
  }
  return admin.app();
};

export const db = () => {
  return getFirestore(getApp());
};

export const getCollection = <T>(colName: string) => {
  return db().collection(colName) as FirebaseFirestore.CollectionReference<T>;
};
