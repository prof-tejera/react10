import styled from 'styled-components';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';

import { Authors } from './Authors';
import RichText from './RichText';
import { CREATE, GET_ALL, GET_AUTHORS, GET_BY_ID, PUBLISH } from './Queries';
import { useState } from 'react';
import { Button, Input } from './Styles';
import htmlToAST from './htmlToAST';

const PostWrapper = styled.div`
  border-bottom: 1px solid #eee;
  padding: 20px 0px;
  font-size: 25px;
`;

export const Posts = ({ posts }) => {
  return posts.map(p => (
    <PostWrapper>
      <div>
        <Link to={`/post/${p.id}`}>
          <b>{p.title}</b>
        </Link>
      </div>
      <Authors authors={p.authors} />
    </PostWrapper>
  ));
};

export const Post = () => {
  const { id } = useParams();

  const { data, loading } = useQuery(GET_BY_ID, {
    variables: {
      id,
    },
    fetchPolicy: 'network-only',
  });

  if (loading) return <div>Loading...</div>;

  const { post } = data;

  if (!post) return <div>Post Not Found with ID: {id}</div>;

  return (
    <div>
      <h1>{post.title}</h1>
      <Authors authors={post.authors} />
      <div dangerouslySetInnerHTML={{ __html: post.content.html }} />
    </div>
  );
};

export const Create = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorId, setAuthorId] = useState('');

  const [creating, setCreating] = useState(false);

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
        disabled={creating}
        onClick={() => {
          setCreating(true);

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
            const { id } = r.data.createPost;

            publishPost({
              variables: {
                id,
              },
              refetchQueries: [
                {
                  query: GET_ALL,
                },
              ],
              awaitRefetchQueries: true,
            }).then(() => {
              navigate('/');
              setCreating(false);
            });
          });
        }}
      >
        {creating ? 'Saving...' : 'Submit'}
      </Button>
    </div>
  );
};
