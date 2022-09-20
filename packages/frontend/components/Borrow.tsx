import { useState } from 'react'
import { useMachine } from '@xstate/react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { CircularProgress } from '@mui/material'

import borrowMachine from '../machines/borrow.machine'
import { chains } from '../machines/auth.machine'
import CustomSelect from './Form/CustomSelect'
import styles from '../styles/components/Borrow.module.css'

export default function Borrow () {
  const [current, send] = useMachine(borrowMachine, { devTools: true })
  const { collateral } = current.context
  const tokens = ['ETH', 'USDC'] // TODO: Should be selected depending on ??

  const [collateralChainId, setCollateralChain] = useState(chains[0].id)
  const [collateralValue, setCollateralValue] = useState('')
  const [collateralToken, setCollateralToken] = useState(tokens[0])

  const [borrowChainId, setBorrowChainId] = useState(chains[0].id)
  const [borrowValue, setBorrowValue] = useState('')
  const [borrowToken, setBorrowToken] = useState(tokens[1])

  return (
    <Container>
      <p>
        Current state: <code>{current.value as string}</code>
      </p>
      {current.matches('initial') && (
        <button onClick={() => send('initialize')}>Initialize</button>
      )}

      {current.matches('editing') && (
        <Card sx={{ maxWidth: 500 }}>
          <CardContent>
            <Typography variant='h4' mb='1rem'>
              Borrow
            </Typography>
            <CustomSelect
              labelId='collateral-chain-label'
              id='collateral-chain'
              value={collateralChainId}
              onSelect={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCollateralChain(e.target.value)
              }
              options={chains}
              label='Collateral from'
            />
            <Card variant='outlined'>
              <TextField
                id='collateral-amount'
                type='number'
                placeholder='0'
                //label='amount'
                value={collateralValue}
                onChange={e => setCollateralValue(e.target.value)}
              />
              <CustomSelect
                labelId='collateral-token-label'
                id='collateral-token'
                value={collateralToken}
                onSelect={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCollateralToken(e.target.value)
                }
                options={tokens}
                label={null}
              />
              <br />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>?? $</strong>
                <div>
                  <Button
                    className={styles.maxBtn}
                    sx={{ color: '#EC2668' }} // TODO: Color didn't find in reusables components list
                    variant='text'
                  >
                    max
                  </Button>
                  Balance: <strong>??</strong>
                </div>
              </div>
            </Card>

            <br />
            <br />
            <CustomSelect
              labelId='borrow-chain-label'
              id='borrow-chain'
              value={borrowChainId}
              onSelect={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBorrowChainId(e.target.value)
              }
              options={chains}
              label='Borrow to'
            />
            <Card variant='outlined'>
              <TextField
                id='borrow-amount'
                type='number'
                placeholder='0'
                //label='amount'
                value={borrowValue}
                onChange={e => setBorrowValue(e.target.value)}
              />
              <CustomSelect
                labelId='borrow-token-label'
                id='borrow-token'
                value={borrowToken}
                onSelect={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBorrowToken(e.target.value)
                }
                options={tokens}
                label={null}
              />
            </Card>
            <br />
            <br />
            <Button
              variant='gradient'
              sx={{width: '23em'}}
              onClick={() => alert('not implemented')}
              startIcon={<CircularProgress size={15} />}
            >
              Sign
            </Button>
            <br />
            <br />
            <Button
              variant='primary'
              sx={{width: '23em'}}
              onClick={() => alert('not implemented')}
            >
              Borrow
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
