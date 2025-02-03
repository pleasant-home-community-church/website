import { MantineProvider } from '@mantine/core';
import { Table } from './Table';
import type { Sermon } from '~/types';

interface SermonTableProps {
  sermons: Sermon[];
}

export const SermonsTable = ({sermons}: SermonTableProps) => {

  // convert sermon to sermon record
  // const records: SermonRecord[] = sermons?.map(sermon => ({
  //   title: sermon.title,
  //   bibleText: sermon.bibleText,
  // }));

  return (
    <MantineProvider>
      <Table sermons={sermons} />
    </MantineProvider>
  );
};

export default SermonsTable;
