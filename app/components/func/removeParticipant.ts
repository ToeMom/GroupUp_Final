import { getApolloClient } from '../../apollo-client';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client';

const REMOVE_PARTICIPANT_FROM_EVENT = gql`
  mutation RemoveParticipantFromEvent($eventId: ID!) {
    removeParticipantFromEvent(eventId: $eventId) {
      id
      title
      participants
    }
  }
`;

type RemoveParticipantProps = {
  eventId: string | string[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export const useRemoveParticipant = ({ onSuccess, onError }: RemoveParticipantProps) => {
  const [removeParticipant, { loading, error }] = useMutation(REMOVE_PARTICIPANT_FROM_EVENT, {
    client: getApolloClient()
  });

  const removeUserFromEvent = async (eventId: string | string[]) => {
    try {
      const { data } = await removeParticipant({ variables: { eventId } });
      if (onSuccess) onSuccess();
      console.log('Successfully removed participant:', data);
    } catch (err) {
      console.error('Error removing participant:', err);
      if (onError) onError(err as Error);
    }
  };

  return {
    removeUserFromEvent,
    loading,
    error,
  };
};
