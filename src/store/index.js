import Vue from 'vue';
import Vuex from 'vuex';
import {
  auth,
  usersCollection,
  postsCollection,
  commentsCollection,
  likesCollection,
} from '../firebase';
import router from '../router/index';

Vue.use(Vuex);

// realtime firebase
postsCollection.orderBy('createdOn', 'desc').onSnapshot((snapshot) => {
  let postsArray = [];

  snapshot.forEach((doc) => {
    let post = doc.data();
    post.id = doc.id;

    postsArray.push(post);
  });

  store.commit('setPosts', postsArray);
});

const store = new Vuex.Store({
  state: {
    userProfile: {},
    posts: [],
  },
  mutations: {
    setUserProfile(state, val) {
      state.userProfile = val;
    },
    setPerformingRequest(state, val) {
      state.performingRequest = val;
    },
    setPosts(state, val) {
      state.posts = val;
    },
  },
  actions: {
    async login({ dispatch }, form) {
      // sign user in
      const { user } = await auth.signInWithEmailAndPassword(
        form.email,
        form.password
      );

      // fetch user profile and set in state
      dispatch('fetchUserProfile', user);
    },
    async signup({ dispatch }, form) {
      // sign user up
      const { user } = await auth.createUserWithEmailAndPassword(
        form.email,
        form.password
      );

      // create user object in userCollections
      await usersCollection.doc(user.uid).set({
        name: form.name,
        title: form.title,
      });

      // fetch user profile and set in state
      dispatch('fetchUserProfile', user);
    },
    async fetchUserProfile({ commit }, user) {
      // fetch user profile
      const userProfile = await usersCollection.doc(user.uid).get();

      // set user profile in state
      commit('setUserProfile', userProfile.data());

      // change route to dashboard
      if (router.currentRoute.path === '/login') {
        router.push('/');
      }
    },
    async logout({ commit }) {
      // log user out
      await auth.signOut();

      // clear user data from state
      commit('setUserProfile', {});

      // redirect to login view
      router.push('/login');
    },
    async createPost({ state, commit }, post) {
      console.log('create post', commit);
      // create post in firebase
      await postsCollection.add({
        createdOn: new Date(),
        content: post.content,
        userId: auth.currentUser.uid,
        userName: state.userProfile.name,
        comments: 0,
        likes: 0,
      });
    },
    async likePost({ commit }, post) {
      console.log('like post', commit);
      const userId = auth.currentUser.uid;
      const docId = `${userId}_${post.id}`;

      // check if user has liked post
      const doc = await likesCollection.doc(docId).get();
      if (doc.exists) {
        return;
      }

      // create post
      await likesCollection.doc(docId).set({
        postId: post.id,
        userId: userId,
      });

      // update post likes count
      postsCollection.doc(post.id).update({
        likes: post.likesCount + 1,
      });
    },
    async updateProfile({ dispatch }, user) {
      const userId = auth.currentUser.uid;
      // update user object
      const userRef = await usersCollection.doc(userId).update({
        name: user.name,
        title: user.title,
      });
      console('update profile', userRef);

      dispatch('fetchUserProfile', { uid: userId });

      // update all posts by user
      const postDocs = await postsCollection
        .where('userId', '==', userId)
        .get();
      postDocs.forEach((doc) => {
        postsCollection.doc(doc.id).update({
          userName: user.name,
        });
      });

      // update all comments by user
      const commentDocs = await commentsCollection
        .where('userId', '==', userId)
        .get();
      commentDocs.forEach((doc) => {
        commentsCollection.doc(doc.id).update({
          userName: user.name,
        });
      });
    },
  },
});

export default store;
