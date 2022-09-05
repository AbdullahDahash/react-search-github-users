import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, SetGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});

  const checkRequests = () => {
    axios("https://api.github.com/rate_limit")
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        if (remaining === 0) {
          // throw an error
          toggleError(true, "sorry, you have exceeded your hourly rate limit!");
        }
        console.log(data);
        setRequests(remaining);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // Error

  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  const searchGithubUser = async (user) => {
    toggleError();
    setLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      const { login, followers_url } = response.data;
      SetGithubUser(response.data);

      // Repos

      await Promise.allSettled([
        axios(`https://api.github.com/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((ressults) => {
        const [repos, followers] = ressults;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "there is no user with that username");
    }
    setLoading(false);
    console.log(response);
  };

  useEffect(checkRequests, [githubUser]);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
