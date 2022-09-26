import { useState } from 'react'
import { useMachine } from '@xstate/react'
import {
  Divider,
  Button,
  Container,
  Typography,
  CardContent,
  Card,
  Collapse
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import Image from 'next/image'

import borrowMachine from '../machines/borrow.machine'
import { chains } from '../machines/auth.machine'
import CustomSelect from './Form/CustomSelect'
import SelectTokenCard from './SelectTokenCard'
import styles from '../styles/components/Borrow.module.css'

export default function Borrow () {
  const [current, send] = useMachine(borrowMachine, { devTools: true })
  const { collateral } = current.context
  const tokens = ['ETH', 'USDC'] // TODO: Should be selected depending on ??

  const [collateralChainId, setCollateralChain] = useState(chains[0].id)
  const [collateralValue, setCollateralValue] = useState('')
  const [collateralToken, setCollateralToken] = useState(tokens[0])

  const [borrowChainId, setBorrowChainId] = useState(chains[1].id)
  const [borrowValue, setBorrowValue] = useState('')
  const [borrowToken, setBorrowToken] = useState(tokens[1])

  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

  return (
    <Container>
      <p>
        Current state: <code>{current.value as string}</code>
      </p>
      {current.matches('initial') && (
        <button onClick={() => send('initialize')}>Initialize</button>
      )}

      {current.matches('editing') && (
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1.5rem 2rem'
          }}
        >
          <CardContent>
            <Typography variant='body' mb='1rem'>
              Borrow
            </Typography>

            <Divider sx={{ mt: 1.5 }} />

            <CustomSelect
              labelId='collateral-chain-label'
              id='collateral-chain'
              value={collateralChainId}
              onSelect={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCollateralChain(e.target.value)
              }
              options={chains}
              label='Collateral from'
              large={false}
            />

            <SelectTokenCard
              value={collateralValue}
              onChangeValue={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCollateralValue(e.target.value)
              }
              token={collateralToken}
              onChangeToken={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCollateralToken(e.target.value)
              }
              tokens={tokens}
              type='collateral'
            />
            <CustomSelect
              labelId='borrow-chain-label'
              id='borrow-chain'
              value={borrowChainId}
              onSelect={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBorrowChainId(e.target.value)
              }
              options={chains}
              label='Borrow to'
              large={false}
            />

            <SelectTokenCard
              value={borrowValue}
              onChangeValue={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBorrowValue(e.target.value)
              }
              token={borrowToken}
              onChangeToken={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBorrowToken(e.target.value)
              }
              tokens={tokens}
              type='borrow'
            />

            <br />
            <Card variant='outlined'>
              <div className={styles.cardLine} style={{ height: 0 }}>
                <Typography variant='small'>Estimated Cost</Typography>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant='small'>~$3.90</Typography>
                  {showTransactionDetails ? (
                    <KeyboardArrowDownIcon
                      onClick={() => setShowTransactionDetails(false)}
                    />
                  ) : (
                    <KeyboardArrowUpIcon
                      onClick={() => setShowTransactionDetails(true)}
                    />
                  )}
                </div>
              </div>
              <Collapse in={showTransactionDetails} sx={{ width: '100%' }}>
                <div
                  className={styles.cardLine}
                  style={{ width: '92%', marginTop: '1rem' }}
                >
                  <Typography variant='small'>Gas fees</Typography>
                  <Typography variant='small'>~$1.90</Typography>
                </div>
                <br />
                <div className={styles.cardLine} style={{ width: '92%' }}>
                  <Typography variant='small'>Bridges fees</Typography>
                  <Typography variant='small'>~$2.00</Typography>
                </div>
                <br />
                <div className={styles.cardLine} style={{ width: '92%' }}>
                  <Typography variant='small'>Est. processing time</Typography>
                  <Typography variant='small'>~2 Minutes</Typography>
                </div>
                <br />
                <div className={styles.cardLine} style={{ width: '92%' }}>
                  <Typography variant='small'>Route</Typography>
                  <Typography variant='small'>
                    <u>{'ETH > Polygon'}</u>
                  </Typography>
                </div>
              </Collapse>
            </Card>
            <br />
            <br />
            <Button
              variant='primary'
              disabled
              onClick={() => alert('not implemented')}
              fullWidth
            >
              Sign
            </Button>
            <br />
            <br />
            <Button
              variant='gradient'
              disabled
              onClick={() => alert('not implemented')}
              fullWidth
            >
              Borrow
            </Button>
            <br />
            <br />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Typography variant='small'>
                Powered by
                <a
                  href='https://www.connext.network/'
                  target='_blank'
                  rel='noreferrer'
                >
                  <Image
                    src='/assets/images/logo/connext.svg'
                    height={16}
                    width={95}
                    alt='Connext logo'
                  />
                </a>
              </Typography>
            </div>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
