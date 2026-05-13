import { EmptyState } from '@/components/empty-state';
import { Icons } from '@/constants/icons';

const MailScreen = () => {
  return (
    <EmptyState
      icon={Icons.emptyMail}
      title="No messages yet"
      body="When your Group sends notes between editions, they'll show up here."
    />
  );
};

export default MailScreen;
