"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { getApolloClient } from "../apollo-client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Reply,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";

const GET_COMMENTS_BY_EVENT = gql`
  query GetCommentsByEvent($eventId: ID!) {
    getCommentsByEvent(eventId: $eventId) {
      id
      eventId
      username
      userId
      text
      createdAt
    }
  }
`;

const GET_REPLIES = gql`
  query GetReplies($commentId: ID!) {
    getReplies(commentId: $commentId) {
      id
      eventId
      username
      userId
      text
      createdAt
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment($comment: CommentInput!) {
    addComment(comment: $comment) {
      id
      eventId
      username
      userId
      text
      createdAt
    }
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId)
  }
`;

interface Comment {
  id: string;
  eventId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
  parentCommentId?: string;
}

interface CommentsProps {
  eventId: string | string[];
  currentUserId?: string;
  username: string;
  eventCreatorId: string;
}

const Comments: React.FC<CommentsProps> = ({
  eventId,
  currentUserId,
  username,
  eventCreatorId,
}) => {
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsVerified(user.emailVerified);
      } else {
        setIsVerified(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const {
    data: commentsData,
    loading: commentsLoading,
    error: commentsError,
  } = useQuery(GET_COMMENTS_BY_EVENT, {
    client: getApolloClient(),
    variables: { eventId },
  });

  const [addComment] = useMutation(ADD_COMMENT, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_COMMENTS_BY_EVENT, variables: { eventId } }],
  });

  const [deleteComment] = useMutation(DELETE_COMMENT, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_COMMENTS_BY_EVENT, variables: { eventId } }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !isVerified) return;

    await addComment({
      variables: {
        comment: {
          eventId,
          username,
          text,
          parentCommentId: replyingTo || null,
        },
      },
    });

    setText("");
    setReplyingTo(null);
  };

  const handleDelete = async (commentId: string, commentUserId: string) => {
    if (!isVerified) return;

    if (currentUserId === commentUserId || currentUserId === eventCreatorId) {
      if (window.confirm("Are you sure you want to delete this comment?")) {
        await deleteComment({ variables: { commentId } });
      }
    } else {
      alert("You do not have permission to delete this comment.");
    }
  };

  const handleReply = (commentId: string) => {
    if (!isVerified) return;
    setReplyingTo(commentId);
  };

  const toggleReplies = (commentId: string) => {
    if (!isVerified) return;
    const newExpandedComments = new Set(expandedComments);
    if (newExpandedComments.has(commentId)) {
      newExpandedComments.delete(commentId);
    } else {
      newExpandedComments.add(commentId);
    }
    setExpandedComments(newExpandedComments);
  };

  if (commentsLoading)
    return (
      <p className="text-center text-muted-foreground">Načítání komentářů...</p>
    );
  if (commentsError)
    return (
      <p className="text-center text-red-500">
        Chyba při načítání komentářů: {commentsError.message}
      </p>
    );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold flex items-center">
          <MessageCircle className="mr-2" />
          Komentáře
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isVerified && (
          <p className="text-center text-red-500">
            Pro přidání komentáře musíte mít ověřený e-mail.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              replyingTo ? "Napište odpověď..." : "Přidat komentář..."
            }
            className="mb-2"
            rows={3}
            disabled={!isVerified}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="submit"
              variant="default"
              className="w-full sm:w-auto"
              disabled={!isVerified}
            >
              Odeslat
            </Button>
            {replyingTo && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setReplyingTo(null)}
                className="w-full sm:w-auto"
              >
                Zrušit odpověď
              </Button>
            )}
          </div>
        </form>
        <div className="space-y-4">
          {commentsData?.getCommentsByEvent.map((comment: Comment) => (
            <Card key={comment.id} className="bg-muted">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 md:w-10 md:h-10">
                    <AvatarFallback>{comment.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-semibold truncate">
                        {comment.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-2 break-words">{comment.text}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        className="flex-grow sm:flex-grow-0"
                        disabled={!isVerified}
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        Odpovědět
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReplies(comment.id)}
                        className="flex-grow sm:flex-grow-0"
                        disabled={!isVerified}
                      >
                        {expandedComments.has(comment.id) ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Skrýt odpovědi
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Zobrazit odpovědi
                          </>
                        )}
                      </Button>
                      {(currentUserId === comment.userId ||
                        currentUserId === eventCreatorId) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(comment.id, comment.userId)
                          }
                          className="flex-grow sm:flex-grow-0"
                          disabled={!isVerified}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Smazat
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              {expandedComments.has(comment.id) && (
                <CardFooter>
                  <Replies
                    commentId={comment.id}
                    currentUserId={currentUserId}
                    eventId={eventId}
                    eventCreatorId={eventCreatorId}
                  />
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


interface RepliesProps {
  commentId: string;
  currentUserId?: string;
  eventId: string | string[];
  eventCreatorId: string;
}

const Replies: React.FC<RepliesProps> = ({
  commentId,
  currentUserId,
  eventId,
  eventCreatorId,
}) => {
  const {
    data: repliesData,
    loading: repliesLoading,
    error: repliesError,
  } = useQuery(GET_REPLIES, {
    client: getApolloClient(),
    variables: { commentId },
  });
  const [deleteComment] = useMutation(DELETE_COMMENT, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_COMMENTS_BY_EVENT, variables: { eventId } }],
  });

  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsVerified(user.emailVerified);
      } else {
        setIsVerified(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (commentId: string, commentUserId: string) => {
    if (!isVerified) return;

    if (currentUserId === commentUserId || currentUserId === eventCreatorId) {
      if (window.confirm("Are you sure you want to delete this comment?")) {
        await deleteComment({ variables: { commentId } });
      }
    } else {
      alert("You do not have permission to delete this comment.");
    }
  };

  if (repliesLoading)
    return (
      <p className="text-center text-muted-foreground">Loading replies...</p>
    );
  if (repliesError)
    return (
      <p className="text-center text-red-500">
        Error loading replies: {repliesError.message}
      </p>
    );

  return (
    <div className="w-full space-y-4">
      {repliesData?.getReplies.map((reply: Comment) => (
        <div
          key={reply.id}
          className="pl-3 md:pl-4 border-l-2 border-muted-foreground"
        >
          <div className="flex items-start gap-3">
            <Avatar className="w-6 h-6 md:w-8 md:h-8">
              <AvatarFallback>{reply.username[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold truncate">{reply.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(reply.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="mt-2 break-words">{reply.text}</p>
              {(currentUserId === reply.userId ||
                currentUserId === eventCreatorId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(reply.id, reply.userId)}
                  className="mt-2"
                  disabled={!isVerified}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Comments;
