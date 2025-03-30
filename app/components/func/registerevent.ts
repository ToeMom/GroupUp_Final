import { getApolloClient } from '../../apollo-client';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client';

const ADD_PARTICIPANT_TO_EVENT = gql`
  mutation AddParticipantToEvent($eventId: ID!) {
    addParticipantToEvent(eventId: $eventId) {
      id
      title
      participants
    }
  }
`;



type AddParticipantProps = {
  eventId: string | string[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export const useAddParticipant = ({ onSuccess, onError }: AddParticipantProps) => {
  const [addParticipant, { loading, error }] = useMutation(ADD_PARTICIPANT_TO_EVENT, {
    client: getApolloClient()
  });

  const addUserToEvent = async (eventId: string | string[]) => {
    try {
      const { data } = await addParticipant({ variables: { eventId } });
      if (onSuccess) onSuccess();
      console.log('Successfully added participant:', data);
    } catch (err) {
      console.error('Error adding participant:', err);
      if (onError) onError(err as Error);
    }
  };

  return {
    addUserToEvent,
    loading,
    error,
  };
};
