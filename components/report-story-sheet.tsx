import { useState } from 'react';
import { AccessibilityInfo, Alert, Keyboard, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { useAuth } from '@/hooks/use-auth';
import { openPostReport, REPORT_NOTE_MAX_LENGTH, sendStoryReport } from '@/lib/report';
import type { PostWithAuthor } from '@/types';

import { FormButton } from './form-button';
import { FormField } from './form-field';
import { FormSheet, SHEET_ACTION_TEXT_CAP } from './form-sheet';
import { StatusBanner } from './status-banner';
import { ThemedText } from './themed-text';

type Status = 'writing' | 'sending' | 'sent' | 'failed';

type Props = {
  post: PostWithAuthor;
  visible: boolean;
  onClose: () => void;
};

// The report form (BRAND §9 → Moderation affordances): an optional note, sent
// from inside the app — a reviewer's phone may have no Mail account to hand a
// draft to. If sending fails, the drafted email is still there as a way out.
// Closing keeps what was written until the report goes; screen readers hear
// the outcome, since the button they pressed changes under them.
export const ReportStorySheet = ({ post, visible, onClose }: Props) => {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('writing');
  const sending = status === 'sending';

  // Each opening starts on the form. Reset as it opens, not as it closes: the
  // sheet stays on screen through its fade-out, and resetting then would
  // flash the form back over "Thanks".
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setStatus('writing');
  }

  const close = () => {
    if (status === 'sent') setNote('');
    onClose();
  };

  const send = async () => {
    Keyboard.dismiss();
    setStatus('sending');
    try {
      await sendStoryReport(post.id, note);
      setStatus('sent');
      AccessibilityInfo.announceForAccessibility(Strings.report.sent);
    } catch (err) {
      if (__DEV__) console.warn('report-story failed', err);
      setStatus('failed');
      AccessibilityInfo.announceForAccessibility(Strings.report.failed);
    }
  };

  const emailInstead = async () => {
    if (await openPostReport(post, user?.id ?? null, note)) {
      close();
      return;
    }
    Alert.alert(Strings.report.noMailTitle, Strings.report.noMailBody(Strings.legal.supportEmail));
  };

  // One primary button through every state — Send report, Try again, Done —
  // so a screen reader's focus stays on it while its label changes.
  const primaryTitle =
    status === 'sent'
      ? Strings.report.done
      : status === 'failed'
        ? Strings.report.retry
        : Strings.report.send;

  const footer = (
    <>
      <FormButton
        title={primaryTitle}
        onPress={status === 'sent' ? close : send}
        loading={sending}
        maxFontSizeMultiplier={SHEET_ACTION_TEXT_CAP}
      />
      {status === 'sent' ? null : (
        <FormButton
          title={Strings.report.cancel}
          variant="secondary"
          onPress={close}
          disabled={sending}
          maxFontSizeMultiplier={SHEET_ACTION_TEXT_CAP}
        />
      )}
    </>
  );

  return (
    <FormSheet
      visible={visible}
      title={Strings.report.sheetTitle}
      onClose={close}
      dismissible={!sending}
      footer={footer}
    >
      {status === 'sent' ? (
        <ThemedText variant="ui">{Strings.report.sent}</ThemedText>
      ) : (
        <>
          <ThemedText variant="ui" style={styles.intro}>
            {Strings.report.sheetIntro}
          </ThemedText>
          <FormField
            label={Strings.report.noteLabel}
            accessibilityLabel={Strings.report.noteLabel}
            value={note}
            onChangeText={setNote}
            editable={!sending}
            multiline
            maxLength={REPORT_NOTE_MAX_LENGTH}
            textAlignVertical="top"
            boxed
            style={styles.note}
          />
          {status === 'failed' ? (
            <>
              <StatusBanner variant="error" message={Strings.report.failed} />
              <FormButton title={Strings.report.emailInstead} variant="ghost" onPress={emailInstead} />
            </>
          ) : null}
        </>
      )}
    </FormSheet>
  );
};

const styles = StyleSheet.create({
  intro: {
    color: Colors.inkSoft,
  },
  note: {
    minHeight: Layout.input.multilineMinHeight,
  },
});
