import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ALL } from './Queries';
import { Alert } from './Styles';
import { Posts } from './Posts';

const Home = () => {
  const { data, loading, error } = useQuery(GET_ALL);

  if (loading) return <div>Loading...</div>;

  if (error) return <div>Failed</div>;

  const { posts } = data;
  const length = posts.length;

  return (
    <div>
      <h1>
        Welcome <Link to="/create">+</Link>
      </h1>
      {length === 0 && (
        <Alert>
          There are no entries in this blog, <Link to="/create">create one</Link>!
        </Alert>
      )}
      <Posts posts={posts} />
    </div>
  );
};

export default Home;
