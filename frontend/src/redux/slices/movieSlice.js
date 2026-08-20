import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  trending: [],
  popular: [],
  tvShows: [],
  topRated: [],
};

const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    setTrending: (state, action) => {
      state.trending = action.payload;
    },
    setPopular: (state, action) => {
      state.popular = action.payload;
    },
    setTvShows: (state, action) => {
      state.tvShows = action.payload;
    },
  },
});

export const { setTrending, setPopular, setTvShows } = movieSlice.actions;
export default movieSlice.reducer;
