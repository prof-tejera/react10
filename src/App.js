import { useEffect, useState } from 'react';
import Config from './Config';
import Blog from './Blog';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${Config.GITHUB}`,
};

const fetchRest = () =>
  fetch('https://api.github.com/users/bolek/repos', {
    method: 'GET',
    headers,
  })
    .then(r => r.json())
    .catch(err => {
      console.error(err);
    });

const fetchGraphQL = () =>
  fetch('https://api.github.com/graphql', {
    headers,
    method: 'POST',
    body:
      '{"query":"{\\n  user(login: \\"bolek\\") {\\n    repositories(first: 30, orderBy: { field: NAME, direction: ASC}) {\\n      nodes {\\n        name\\n        url\\n      }\\n    }\\n  }\\n}"}',
  })
    .then(r => r.json())
    .then(r => r.data.user.repositories.nodes)
    .catch(err => {
      console.error(err);
    });

const Repositories = ({ type }) => {
  const [repos, setRepos] = useState(null);

  useEffect(() => {
    const fetcher = type === 'REST' ? fetchRest : fetchGraphQL;
    fetcher().then(setRepos);
  }, [type]);

  if (!repos) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{type}</h2>
      <h3>Size: {JSON.stringify(repos).length.toLocaleString()} characters</h3>
      {repos.map(r => (
        <div key={r.id}>
          <a href={r.url}>{r.name}</a>
        </div>
      ))}
    </div>
  );
};

// const App = () => {
//   return (
//     <div style={{ display: 'flex' }}>
//       <div style={{ flex: 1 }}>
//         <Repositories type="REST" />
//       </div>
//       <div style={{ flex: 1 }}>
//         <Repositories type="GRAPHQL" />
//       </div>
//     </div>
//   );
// };

const App = () => {
  return <Blog />;
};

export default App;
