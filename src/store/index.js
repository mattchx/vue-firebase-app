import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})

async logout({ commit }) {
    await fb.auth.signOut()
  
    // clear userProfile and redirect to /login
    commit('setUserProfile', {})
    router.push('/login')
  }