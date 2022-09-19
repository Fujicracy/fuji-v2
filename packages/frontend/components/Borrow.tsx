import { useState } from 'react'
import { useMachine } from '@xstate/react'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

import borrowMachine from '../machines/borrow.machine'
import { chains } from '../machines/auth.machine'
import { CircularProgress } from '@mui/material'

type Chain = typeof chains[0]

export default function Borrow () {
  const [current, send] = useMachine(borrowMachine, { devTools: true })
  const { collateral } = current.context
  const tokens = ['ETH', 'USDC'] // TODO: Should be selected depending on ??

  const [collateralChainId, setCollateralChain] = useState(chains[0].id)
  const [collateralValue, setCollateralValue] = useState('')
  const [collateralToken, setCollateralToken] = useState(tokens[0])

  const [borrowChaiIdn, setBorrowChaiIdn] = useState(chains[0].id)
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
            <FormControl>
              <InputLabel id='collateral-chain-label'>
                Collateral from
              </InputLabel>
              <Select
                labelId='collateral-chain-label'
                id='collateral-chain'
                value={collateralChainId}
                onChange={e => setCollateralChain(e.target.value)}
              >
                {chains.map((chain: Chain) => (
                  <MenuItem key={chain.id} value={chain.id}>
                    {chain.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Card variant='outlined'>
              <TextField
                id='collateral-amount'
                type='number'
                placeholder='0'
                //label='amount'
                value={collateralValue}
                onChange={e => setCollateralValue(e.target.value)}
              />
              <FormControl>
                {/* <InputLabel id='collateral-token-label'>Select coin</InputLabel> */}
                <Select
                  labelId='collateral-token-label'
                  id='collateral-token'
                  value={collateralToken}
                  onChange={e => setCollateralToken(e.target.value)}
                >
                  {tokens.map(t => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Card>
            <br />
            Value: <strong>?? $</strong>- Balance: <strong>??</strong>
            <Button variant='text'>max</Button>
            <br />
            <br />
            <FormControl>
              <InputLabel id='borrow-chain-label'>Borrow on</InputLabel>
              <Select
                labelId='borrow-chain-label'
                id='borrow-chain'
                value={borrowChaiIdn}
                onChange={e => setBorrowChaiIdn(e.target.value)}
              >
                {chains.map((chain: Chain) => (
                  <MenuItem key={chain.id} value={chain.id}>
                    {chain.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Card variant='outlined'>
              <TextField
                id='borrow-amount'
                type='number'
                placeholder='0'
                //label='amount'
                value={borrowValue}
                onChange={e => setBorrowValue(e.target.value)}
              />
              <FormControl>
                {/* <InputLabel id='borrow-token-label'>Select coin</InputLabel> */}
                <Select
                  labelId='borrow-token-label'
                  id='borrow-token'
                  value={borrowToken}
                  onChange={e => setBorrowToken(e.target.value)}
                >
                  {tokens.map(t => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Card>
            <br />
            <br />
            <Button
              variant='gradient'
              onClick={() => alert('not implemented')}
              startIcon={<CircularProgress />}
              sx={{ width: '90%' }}
            >
              Sign
            </Button>
            <br />
            <br />
            <Button
              variant='flat'
              disabled
              onClick={() => alert('not implemented')}
              sx={{ width: '90%' }}
            >
              Borrow
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
