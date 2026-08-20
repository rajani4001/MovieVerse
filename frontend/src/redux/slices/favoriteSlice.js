import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  favorites: [],
};

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavorites: (state, action) => {
      state.favorites = action.payload;
    },
    addFavoriteMovie: (state, action) => {
      // Avoid duplicate adds
      if (!state.favorites.find(f => f.movie._id === action.payload.movie._id)) {
        state.favorites.push(action.payload);
      }
    },
    removeFavoriteMovie: (state, action) => {
      state.favorites = state.favorites.filter(
        (fav) => fav.movie._id !== action.payload
      );
    },
  },
});

export const { setFavorites, addFavoriteMovie, removeFavoriteMovie } = favoriteSlice.actions;
export default favoriteSlice.reducer;
