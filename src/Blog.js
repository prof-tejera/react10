/**
 * Apollo Docs: apollographql.com/docs/react/
 * QuillJS: https://quilljs.com/
 * React QuillJS: https://github.com/zenoamaro/react-quill
 * React Router: https://reactrouter.com/
 * GraphCMS: https://graphcms.com
 */

import htmlToAST from './htmlToAST';
import { ApolloProvider, ApolloClient, InMemoryCache, useQuery, useMutation } from '@apollo/client';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import { BrowserRouter as Router, Switch, Route, Link, useParams, useHistory } from 'react-router-dom';
import { GET_BY_ID, GET_ALL, GET_BY_AUTHOR, GET_AUTHORS, CREATE, PUBLISH } from './Posts';
import Config from './Config';

const Nav = styled.nav`
  background: #023e8a;
  color: white;

  ul {
    display: flex;
    list-style: none;
    margin: 0px;
    padding: 20px;

    li {
      padding: 0px 20px;
    }

    a {
      text-decoration: none;
      color: white;
    }
  }
`;

const Content = styled.div`
  margin: 0px 100px;
  padding: 40px 0px;
`;

const Input = styled.input`
  border: none;
  border-bottom: 1px dotted #888;
  font-size: 20px;
  padding: 10px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  margin-top: 60px;
  background-color: #023e8a;
  color: white;
  padding: 10px;
  font-size: 20px;
  border: none;
  border-radius: 5px;
`;

const Alert = styled.div`
  background-color: #eee;
  padding: 10px;
  font-size: 20px;
  border: none;
  border-radius: 5px;
`;

const PostWrapper = styled.div`
  padding: 10px 0px;
`;

const Authors = ({ authors }) => {
  return (
    <div>
      by{' '}
      {authors.map(a => (
        <Link key={a.id} to={`/author/${a.id}`} style={{ marginRight: 10 }}>
          {a.name}
        </Link>
      ))}
    </div>
  );
};

const Post = () => {
  const { id } = useParams();

  const { data, loading } = useQuery(GET_BY_ID, {
    variables: {
      id,
    },
  });

  if (loading) return <div>Loading...</div>;

  const { post } = data;

  if (!post) return <div>Post Not Found with ID: {id}</div>;

  return (
    <div>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content.html }} />
      <Authors authors={post.authors} />
    </div>
  );
};

const Home = () => {
  const { data, loading } = useQuery(GET_ALL);

  if (loading) return <div>Loading...</div>;

  const { posts } = data;
  const length = posts.length;

  return (
    <div>
      <h1>Welcome to the Blog ({length})</h1>
      {length === 0 && (
        <Alert>
          There are no entries in this blog, <Link to="/create">create one</Link>!
        </Alert>
      )}
      <Posts posts={posts} />
    </div>
  );
};

const Author = () => {
  const { id } = useParams();
  const { data, loading } = useQuery(GET_BY_AUTHOR, {
    variables: {
      authorId: id,
    },
    fetchPolicy: 'network-only',
  });

  if (loading) return <div>Loading...</div>;

  const { posts } = data;
  const length = posts.length;

  return (
    <div>
      <h1>Author Page ({length})</h1>
      {length === 0 && (
        <Alert>
          There are no entries by this author, <Link to="/create">create one</Link>!
        </Alert>
      )}
      <Posts posts={posts} />
    </div>
  );
};

const Create = () => {
  const history = useHistory();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorId, setAuthorId] = useState('');

  const { data, loading } = useQuery(GET_AUTHORS);
  const [createPost] = useMutation(CREATE);
  const [publishPost] = useMutation(PUBLISH);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label>Choose authors:</label>
      <select
        value={authorId}
        onChange={e => {
          setAuthorId(e.target.value);
        }}
      >
        {data.authors.map(a => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="New Post..." />
      <div>
        <RichText onChange={setContent} />
      </div>
      <Button
        onClick={() => {
          const variables = {
            data: {
              title,
              content: {
                children: htmlToAST(content),
              },
              authors: {
                connect: [
                  {
                    id: authorId || data.authors[0].id,
                  },
                ],
              },
            },
          };

          createPost({
            variables,
          }).then(r => {
            const id = r.data.createPost.id;

            publishPost({
              variables: {
                id,
              },
              refetchQueries: [
                {
                  query: GET_ALL,
                },
              ],
            }).then(() => {
              history.push('/');
            });
          });
        }}
      >
        Submit
      </Button>
    </div>
  );
};

const RichText = ({ onChange }) => {
  const { quill, quillRef } = useQuill();

  useEffect(() => {
    if (quill) {
      quill.on('text-change', () => {
        onChange(`${quill.root.innerHTML}`);
      });
    }
  }, [quill, onChange]);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <div ref={quillRef} />
    </div>
  );
};

const Posts = ({ posts }) => {
  return posts.map(p => (
    <div key={p.id} style={{ backgroundColor: '#eee', padding: 10, borderRadius: 10, marginBottom: 10 }}>
      <PostWrapper>
        <Link to={`/post/${p.id}`}>{p.title}</Link>
      </PostWrapper>
      <Authors authors={p.authors} />
    </div>
  ));
};

const Blog = () => {
  return (
    <Router>
      <Nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/create">Create</Link>
          </li>
        </ul>
      </Nav>
      <Content>
        <Switch>
          <Route path="/create">
            <Create />
          </Route>
          <Route path="/post/:id">
            <Post />
          </Route>
          <Route path="/author/:id">
            <Author />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </Content>
    </Router>
  );
};

const Wrapper = () => {
  const apolloClient = new ApolloClient({
    uri: Config.GRAPHCMS,
    cache: new InMemoryCache(),
  });

  return (
    <ApolloProvider client={apolloClient}>
      <Blog />
    </ApolloProvider>
  );
};

export default Wrapper;
