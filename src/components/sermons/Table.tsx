import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; //if using mantine date picker features
import 'mantine-react-table/styles.css'; //make sure MRT styles were imported in your app root (once)

import { useMemo } from 'react';
import {
  type MRT_ColumnDef,
  MRT_Table,
  useMantineReactTable,
} from 'mantine-react-table';
import type { Sermon } from '~/types';
import moment from 'moment';

interface TableProps {
  sermons: Sermon[];
}

export const Table = ({sermons}: TableProps) => {
  const data = useMemo(() => sermons, []);
  const columns = useMemo<MRT_ColumnDef<Sermon>[]>(
    () => [
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Title',
        Cell: ({ row }) => (
          <a href={`/sermons/${row.original.id}`}>{row.original.title}</a>
        ),
      },
      {
        id: 'passage',
        accessorKey: 'bibleText',
        header: 'Passage',
      },
      {
        id: "preachdate",
        accessorFn: (sermon: Sermon) => `${moment(sermon.preachDate).format('MMM D, YYYY')}`,
        header: 'Date',
      },
    ],
    [],
  );

  const table = useMantineReactTable({
    columns,
    data,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    mantineTableProps: {
      className: '.table',
      highlightOnHover: false,
      striped: 'odd',
      withColumnBorders: true,
      withRowBorders: true,
      withTableBorder: true,
    },
  });

  // using MRT_Table instead of MantineReactTable if we do not want any of the toolbar features
  return <MRT_Table table={table} />;
};

export default Table;
