import styled from 'styled-components'

import { textStyle } from '../style/tokens'

/** A row of a list in a dashboard panel (party, initiative): avatar, name and details */
const ListRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
  min-width: 0;
  padding: ${(props) => props.theme.space[2]};
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radius.lg};
`

/** Long names wrap (German words hyphenated, lang="de") instead of widening the row */
const RowInfo = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: break-word;
  hyphens: auto;
`

const RowName = styled.strong`
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

const RowDetails = styled.span`
  ${textStyle('sm')}
  color: ${(props) => props.theme.colors.text.muted};
`

/** Always one column: one row per entry reads faster at the table than a grid */
const RowList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[2]};
  padding: 0;
  list-style: none;
`

export {
  ListRow, RowDetails, RowInfo, RowList, RowName,
}
