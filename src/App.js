import React from "react";
import axios from "axios";
import "./App.css";

const API_ENDPOINT = "https://hn.algolia.com/api/v1/search?query=";

/**
 * for storing last searched story using localStorage object
 * in it there is a state which initialize to the last value from localStorage
 */
const useSemiPersistentState = (key, initialValue) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialValue
  );
  // when App renders, it updates the state for value and the key/value pair in localStorage,
  // this generates a side-effect, so we use useEffect hook to mitigate the state of things outside of the program
  // like the browser API localStorage
  // side-effect hooks simply trigger a side-effect, that's all
  React.useEffect(() => localStorage.setItem(key, value), [value, key]);
  // returns an array
  return [value, setValue];
};

/**
 * useReducer to update App's state based on action's type
 * return new state object
 */
const storiesReducer = (state, action) => {
  switch (action.type) {
    case "STORIES_FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "STORIES_FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "STORIES_FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case "REMOVE_STORY":
      return {
        ...state,
        data: state.data.filter(
          (story) => action.payload.objectID !== story.objectID
        ),
      };
    default:
      throw new Error();
  }
};

// ************************************************************************
const App = () => {
  const [searchTerm, setSearchTerm] = useSemiPersistentState("search", "React");
  const [url, setUrl] = React.useState(`${API_ENDPOINT}${searchTerm}`);

  const [stories, dispatchStories] = React.useReducer(storiesReducer, {
    data: [],
    isLoading: false,
    isError: false,
  });

  const handleFetchStories = React.useCallback(() => {
    dispatchStories({ type: "STORIES_FETCH_INIT" });

    axios
      .get(url)
      .then((result) => {
        dispatchStories({
          type: "STORIES_FETCH_SUCCESS",
          payload: result.data.hits,
        });
      })
      .catch(() => dispatchStories({ type: "STORIES_FETCH_FAILURE" }));
  }, [url]);

  // triggers a side-effect to update things outside the program
  React.useEffect(() => handleFetchStories(), [handleFetchStories]);

  // event handler for when input field's value changes
  // updates state of searchTerm
  const handleSearchInput = (event) => setSearchTerm(event.target.value);

  // submit button handler
  const handleSearchSubmit = (event) => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);
    event.preventDefault();
  };

  // event handler for when button is clicked
  const handleRemoveStory = (item) => {
    dispatchStories({
      type: "REMOVE_STORY",
      payload: item,
    });
  };

  return (
    <div className="container">
      <h1 className="headline-primary">My Hacker Stories</h1>
      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />
      <hr />

      {stories.isError && <p>Something went wrong ...</p>}

      {stories.isLoading ? (
        <p>Loading...</p>
      ) : (
        <List list={stories.data} onRemoveItem={handleRemoveStory} />
      )}
    </div>
  );
};

// ************************************************************************
const SearchForm = ({ searchTerm, onSearchInput, onSearchSubmit }) => (
  <form onSubmit={onSearchSubmit} className="search-form">
    <InputWithLabel
      id="search"
      onInputChange={onSearchInput}
      value={searchTerm}
      isFocused
    >
      <strong>Search: </strong>
    </InputWithLabel>
    <button
      type="submit"
      disabled={!searchTerm}
      className="button button_large"
    >
      Submit
    </button>
  </form>
);
// ************************************************************************
const List = ({ list, onRemoveItem }) =>
  // left: rest operator; right spread operator
  // RHS: spreading the rest of item
  list.map((item) => (
    <Item key={item.objectID} item={item} onRemoveItem={onRemoveItem} />
  ));

// ************************************************************************
const Item = (
  { item, onRemoveItem } // item has been destructured from props
) => {
  return (
    <div key={item.objectID} className="item">
      <span style={{ width: "40%" }}>
        <a href={item.url}>{item.title}</a>{" "}
      </span>
      <span style={{ width: "30%" }}>{item.author}</span>
      <span style={{ width: "10%" }}>{item.num_comments}</span>
      <span style={{ width: "10%" }}>{item.points}</span>
      <span style={{ width: "10%" }}>
        <button
          type="button"
          onClick={() => onRemoveItem(item)}
          className="button button_small"
        >
          Dismiss
        </button>
      </span>
    </div>
  );
};

// ************************************************************************
const InputWithLabel = ({
  id,
  value,
  onInputChange,
  type = "text",
  children,
  isFocused,
}) => {
  // ** imperatively set input focus state **
  // instantiate ref object
  const inputRef = React.useRef();

  React.useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    // default input field type is text if not specified via props passed in
    <>
      <label htmlFor={id} className="label">
        {" "}
        {children}{" "}
      </label>
      <input
        ref={inputRef}
        type={type}
        id={id}
        onChange={onInputChange}
        value={value}
        autoFocus={isFocused}
        className="input"
      />
      <p>
        Searching for <strong>{value}</strong>
      </p>
    </>
  );
};

export default App;
