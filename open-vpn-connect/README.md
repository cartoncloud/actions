## Preparing repo/org secrets
- VPN_CONFIG: copy your raw .ovpn config to this secret - it cant reference any other cert,secret, or tls files - i.e. must be self-contained
- VPN_USERNAME: copy your username (if applicable) to this secret - NO NEWLINE
- VPN_PASSWORD: copy your password (if applicable) to this secret - NO NEWLINE

## Usage
```
- uses: cartoncloud/actions/open-vpn-connect@v3
  with:
    config: ${{ secrets.VPN_CONFIG }}
    vpn-user: ${{ secrets.VPN_USERNAME }}
    vpn-pass: ${{ secrets.VPN_PASSWORD }}

.............................
.. Use VPN connection here ..
.............................

- name: Kill VPN connection
  if: always()
  run: sudo pkill openvpn  
```
