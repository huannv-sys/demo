// First, require all dependencies
const express = require('express');
const cors = require('cors');
const { RouterOSAPI } = require('node-routeros');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Console log to confirm environment variables are loaded
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT || '3001 (default)');
console.log('ROUTER1_IP:', process.env.ROUTER1_IP || 'Not set');
console.log('ROUTER1_NAME:', process.env.ROUTER1_NAME || 'Not set');
console.log('ROUTER1_MODEL:', process.env.ROUTER1_MODEL || 'Not set');
console.log('ROUTER1_CLIENT:', process.env.ROUTER1_CLIENT || 'Not set');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware đặc biệt cho Replit - đánh dấu máy chủ đang hoạt động
app.use((req, res, next) => {
  res.set('X-Replit-Status', 'ready');
  res.set('X-Replit-App', 'mikrotik-dashboard');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Cache-Control', 'no-store');
  next();
});

// Function to load router list from environment variables
function loadRoutersFromEnv() {
  const routers = [];
  let routerIndex = 1;
  
  // Keep checking for environment variables until no more are found
  while (process.env[`ROUTER${routerIndex}_IP`]) {
    routers.push({
      id: routerIndex,
      name: process.env[`ROUTER${routerIndex}_NAME`] || `Router-${routerIndex}`,
      ip: process.env[`ROUTER${routerIndex}_IP`],
      username: process.env[`ROUTER${routerIndex}_USER`] || 'admin',
      password: process.env[`ROUTER${routerIndex}_PASSWORD`] || '',
      model: process.env[`ROUTER${routerIndex}_MODEL`] || 'Unknown',
      clientName: process.env[`ROUTER${routerIndex}_CLIENT`] || 'Unknown Client',
      // Thêm thông tin về site
      siteId: process.env[`ROUTER${routerIndex}_SITE_ID`] || 'default',
      siteName: process.env[`ROUTER${routerIndex}_SITE_NAME`] || 'Site mặc định',
      siteLocation: process.env[`ROUTER${routerIndex}_SITE_LOCATION`] || 'Không xác định'
    });
    
    routerIndex++;
  }
  
  // If no routers were found in env variables, log a warning
  if (routers.length === 0) {
    console.warn('No router configurations found in environment variables. Please check your .env file.');
    
    // Thêm dữ liệu mẫu để demo nhiều site
    routers.push({
      id: 1,
      name: "Router MikroTik Site 1",
      ip: "192.168.88.1",
      username: "admin",
      password: "",
      model: "hAP lite",
      clientName: "Office",
      siteId: "site1",
      siteName: "Chi nhanh Ho Chi Minh",
      siteLocation: "Quan 1, TP. Ho Chi Minh"
    });
    
    routers.push({
      id: 2,
      name: "Router MikroTik Site 2",
      ip: "192.168.89.1",
      username: "admin",
      password: "",
      model: "RB3011",
      clientName: "Office",
      siteId: "site2",
      siteName: "Chi nhanh Ha Noi",
      siteLocation: "Quan Cau Giay, Ha Noi"
    });
    
    routers.push({
      id: 3,
      name: "Router MikroTik Backup",
      ip: "192.168.88.2",
      username: "admin",
      password: "",
      model: "hEX",
      clientName: "Office",
      siteId: "site1",
      siteName: "Chi nhanh Ho Chi Minh",
      siteLocation: "Quan 1, TP. Ho Chi Minh"
    });
    
    console.log("Đã tạo dữ liệu mẫu với 3 routers trên 2 sites khác nhau.");
  } else {
    console.log(`Loaded ${routers.length} router configurations from environment variables.`);
  }
  
  return routers;
}

// Load router configurations
const routerList = loadRoutersFromEnv();

// Get all routers
app.get('/api/routers', (req, res) => {
  // Return router info without sensitive data
  const safeRouters = routerList.map(router => ({
    id: router.id,
    name: router.name,
    ip: router.ip,
    model: router.model,
    clientName: router.clientName,
    siteId: router.siteId || 'default',  // Thêm thông tin site
    siteName: router.siteName || 'Site mặc định',
    status: 'unknown' // Will be updated with real status
  }));
  
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.json(safeRouters);
});

// API mới: Lấy danh sách sites và routers theo site
app.get('/api/sites', (req, res) => {
  // Tạo nhóm các router theo site
  const siteMap = {};
  
  routerList.forEach(router => {
    const siteId = router.siteId || 'default';
    const siteName = router.siteName || 'Site mac dinh';
    const siteLocation = router.siteLocation || 'Khong xac dinh';
    
    if (!siteMap[siteId]) {
      siteMap[siteId] = {
        id: siteId,
        name: siteName,
        location: siteLocation,
        routers: []
      };
    }
    
    siteMap[siteId].routers.push({
      id: router.id,
      name: router.name,
      ip: router.ip,
      model: router.model,
      status: 'unknown' // Will be updated later
    });
  });
  
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.json(Object.values(siteMap));
});

// API chi tiết về site
app.get('/api/sites/:siteId', (req, res) => {
  const { siteId } = req.params;
  
  // Lọc router theo siteId
  const siteRouters = routerList.filter(router => (router.siteId || 'default') === siteId);
  
  if (siteRouters.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy site' });
  }
  
  // Lấy thông tin site từ router đầu tiên
  const firstRouter = siteRouters[0];
  
  const siteInfo = {
    id: siteId,
    name: firstRouter.siteName || 'Site mac dinh',
    location: firstRouter.siteLocation || 'Khong xac dinh',
    routerCount: siteRouters.length,
    routers: siteRouters.map(router => ({
      id: router.id,
      name: router.name,
      ip: router.ip,
      model: router.model,
      status: 'unknown' // Will be updated later
    }))
  };
  
  res.json(siteInfo);
});

// Get router status
app.get('/api/routers/status', async (req, res) => {
  try {
    const routerStatus = [];
    
    // For each router, check if it's online
    for (const router of routerList) {
      try {
        const connection = new RouterOSAPI({
          host: router.ip,
          user: router.username,
          password: router.password,
          timeout: 5000 // 5 second timeout
        });
        
        await connection.connect();
        
        // If connection successful, router is online
        const systemResource = await connection.write('/system/resource/print');
        const version = await connection.write('/system/package/update/print');
        
        routerStatus.push({
          id: router.id,
          status: 'online',
          version: systemResource[0]?.version || 'unknown',
          uptime: systemResource[0]?.uptime || 'unknown',
          cpuLoad: systemResource[0]?.['cpu-load'] || 0
        });
        
        connection.close();
      } catch (error) {
        // If connection fails, router is offline
        routerStatus.push({
          id: router.id,
          status: 'offline',
          error: error.message
        });
      }
    }
    
    res.json(routerStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed router system information
app.get('/api/routers/:id/system', async (req, res) => {
  try {
    const routerId = parseInt(req.params.id);
    const router = routerList.find(r => r.id === routerId);
    
    if (!router) {
      return res.status(404).json({ error: 'Router không tồn tại' });
    }
    
    try {
      const connection = new RouterOSAPI({
        host: router.ip,
        user: router.username,
        password: router.password,
        timeout: 5000
      });
      
      await connection.connect();
      
      // Lấy thông tin tài nguyên hệ thống
      const systemResource = await connection.write('/system/resource/print');
      // Lấy thông tin phiên bản
      const identity = await connection.write('/system/identity/print');
      // Lấy thông tin license
      const license = await connection.write('/system/license/print');
      // Lấy thông tin health (nhiệt độ, v.v.)
      const health = await connection.write('/system/health/print');
      // Lấy thông tin về routerboard
      const routerboard = await connection.write('/system/routerboard/print');
      
      // Tổng hợp thông tin
      const systemInfo = {
        identity: identity[0]?.name || 'Unknown',
        board: {
          model: routerboard[0]?.model || 'Unknown',
          serialNumber: routerboard[0]?.['serial-number'] || 'Unknown',
          firmware: routerboard[0]?.['firmware-type'] || 'Unknown',
          firmwareVersion: routerboard[0]?.['current-firmware'] || 'Unknown',
          upgradeAvailable: routerboard[0]?.['upgrade-firmware'] || 'Unknown'
        },
        resourceInfo: {
          uptime: systemResource[0]?.uptime || 'Unknown',
          version: systemResource[0]?.version || 'Unknown',
          buildTime: systemResource[0]?.['build-time'] || 'Unknown',
          freeMemory: formatBytes(parseInt(systemResource[0]?.['free-memory'] || 0)),
          totalMemory: formatBytes(parseInt(systemResource[0]?.['total-memory'] || 0)),
          cpuCount: systemResource[0]?.['cpu-count'] || 0,
          cpuFrequency: `${systemResource[0]?.['cpu-frequency'] || 0} MHz`,
          cpuLoad: `${systemResource[0]?.['cpu-load'] || 0}%`,
          freeHddSpace: formatBytes(parseInt(systemResource[0]?.['free-hdd-space'] || 0)),
          totalHddSpace: formatBytes(parseInt(systemResource[0]?.['total-hdd-space'] || 0)),
          architecture: systemResource[0]?.architecture || 'Unknown',
        },
        health: {
          temperature: health[0]?.temperature ? `${health[0].temperature}°C` : 'N/A',
          voltage: health[0]?.voltage ? `${health[0].voltage}V` : 'N/A',
          cpuTemperature: health[0]?.['cpu-temperature'] ? `${health[0]['cpu-temperature']}°C` : 'N/A',
        },
        license: {
          level: license[0]?.['software-id'] || 'Unknown',
          software: license[0]?.['nlevel'] || 'Unknown',
          firmware: license[0]?.['nlevel'] || 'Unknown',
        }
      };
      
      connection.close();
      res.json(systemInfo);
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        message: 'Không thể kết nối đến router'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get services info (DHCP, Firewall, etc)
app.get('/api/routers/:id/services', async (req, res) => {
  try {
    const routerId = parseInt(req.params.id);
    const router = routerList.find(r => r.id === routerId);
    
    if (!router) {
      return res.status(404).json({ error: 'Router không tồn tại' });
    }
    
    try {
      const connection = new RouterOSAPI({
        host: router.ip,
        user: router.username,
        password: router.password,
        timeout: 5000
      });
      
      await connection.connect();
      
      // Lấy thông tin DHCP server
      const dhcpServers = await connection.write('/ip/dhcp-server/print');
      
      // Lấy thông tin DHCP leases
      const dhcpLeases = await connection.write('/ip/dhcp-server/lease/print');
      
      // Lấy thông tin firewall filter rules
      const firewallRules = await connection.write('/ip/firewall/filter/print');
      
      // Lấy thông tin NAT rules
      const natRules = await connection.write('/ip/firewall/nat/print');
      
      // Lấy thông tin wireless
      const wireless = await connection.write('/interface/wireless/print');
      
      // Lấy danh sách client wireless
      const wirelessClients = await connection.write('/interface/wireless/registration-table/print');
      
      // Định dạng thông tin DHCP server
      const formattedDhcpServers = dhcpServers.map(server => ({
        name: server.name,
        interface: server.interface,
        leaseTime: server['lease-time'],
        addressPool: server['address-pool'],
        disabled: server.disabled === 'true' ? 'Vô hiệu hóa' : 'Đã kích hoạt'
      }));
      
      // Định dạng thông tin DHCP leases
      const formattedDhcpLeases = dhcpLeases.map(lease => ({
        address: lease.address,
        macAddress: lease['mac-address'],
        clientId: lease['client-id'],
        expiresAfter: lease['expires-after'],
        hostName: lease['host-name'] || 'N/A',
        status: lease.status,
        dynamic: lease.dynamic === 'true' ? 'Động' : 'Tĩnh',
        active: lease.active === 'true' ? 'Đang hoạt động' : 'Không hoạt động'
      }));
      
      // Định dạng thông tin firewall rules
      const formattedFirewallRules = firewallRules.map(rule => ({
        chain: rule.chain,
        action: rule.action,
        protocol: rule.protocol || 'all',
        srcAddress: rule['src-address'] || 'any',
        dstAddress: rule['dst-address'] || 'any',
        srcPort: rule['src-port'] || 'any',
        dstPort: rule['dst-port'] || 'any',
        disabled: rule.disabled === 'true' ? 'Vô hiệu hóa' : 'Đã kích hoạt'
      }));
      
      // Định dạng thông tin NAT rules
      const formattedNatRules = natRules.map(rule => ({
        chain: rule.chain,
        action: rule.action,
        protocol: rule.protocol || 'all',
        srcAddress: rule['src-address'] || 'any',
        dstAddress: rule['dst-address'] || 'any',
        srcPort: rule['src-port'] || 'any',
        dstPort: rule['dst-port'] || 'any',
        toAddress: rule['to-address'] || 'N/A',
        toPort: rule['to-port'] || 'N/A',
        disabled: rule.disabled === 'true' ? 'Vô hiệu hóa' : 'Đã kích hoạt'
      }));
      
      // Định dạng thông tin wireless
      const formattedWireless = wireless.map(wlan => ({
        name: wlan.name,
        ssid: wlan.ssid || 'N/A',
        band: wlan.band || 'N/A',
        frequency: wlan.frequency || 'N/A',
        channelWidth: wlan['channel-width'] || 'N/A',
        mode: wlan.mode || 'N/A',
        disabled: wlan.disabled === 'true' ? 'Vô hiệu hóa' : 'Đã kích hoạt'
      }));
      
      // Định dạng thông tin wireless clients
      const formattedWirelessClients = wirelessClients.map(client => ({
        interface: client.interface,
        macAddress: client['mac-address'],
        signalStrength: client['signal-strength'] || 'N/A',
        signalToNoise: client['signal-to-noise'] || 'N/A',
        txRate: client['tx-rate'] || 'N/A',
        rxRate: client['rx-rate'] || 'N/A',
        uptime: client.uptime || 'N/A'
      }));
      
      const servicesInfo = {
        dhcp: {
          servers: formattedDhcpServers,
          leases: formattedDhcpLeases
        },
        firewall: {
          filterRules: formattedFirewallRules,
          natRules: formattedNatRules
        },
        wireless: {
          interfaces: formattedWireless,
          clients: formattedWirelessClients
        }
      };
      
      connection.close();
      res.json(servicesInfo);
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        message: 'Không thể kết nối đến router'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs and users info
app.get('/api/routers/:id/logs', async (req, res) => {
  try {
    const routerId = parseInt(req.params.id);
    const router = routerList.find(r => r.id === routerId);
    
    if (!router) {
      return res.status(404).json({ error: 'Router không tồn tại' });
    }
    
    try {
      const connection = new RouterOSAPI({
        host: router.ip,
        user: router.username,
        password: router.password,
        timeout: 5000
      });
      
      await connection.connect();
      
      // Lấy log hệ thống
      const systemLogs = await connection.write('/log/print', {
        limit: 100
      });
      
      // Lấy danh sách user
      const users = await connection.write('/user/print');
      
      // Lấy cấu hình SNMP
      const snmp = await connection.write('/snmp/print');
      
      // Lấy cấu hình DNS
      const dns = await connection.write('/ip/dns/print');
      
      // Lấy cấu hình NTP
      const ntp = await connection.write('/system/ntp/client/print');
      
      // Định dạng log hệ thống
      const formattedSystemLogs = systemLogs.map(log => ({
        time: log.time,
        topics: log.topics,
        message: log.message
      }));
      
      // Định dạng danh sách user
      const formattedUsers = users.map(user => ({
        name: user.name,
        group: user.group,
        lastLogin: user['last-logged-in'] || 'Chưa đăng nhập'
      }));
      
      // Định dạng cấu hình SNMP
      const formattedSnmp = {
        enabled: snmp[0] ? (snmp[0].enabled === 'true' ? 'Đã kích hoạt' : 'Vô hiệu hóa') : 'Không có dữ liệu',
        community: snmp[0] ? snmp[0].contact : 'Không có dữ liệu',
        location: snmp[0] ? snmp[0].location : 'Không có dữ liệu'
      };
      
      // Định dạng cấu hình DNS
      const formattedDns = {
        servers: dns[0] ? dns[0].servers : 'Không có dữ liệu',
        dynamicServers: dns[0] ? dns[0]['dynamic-servers'] : 'Không có dữ liệu',
        allowRemoteRequests: dns[0] ? (dns[0]['allow-remote-requests'] === 'true' ? 'Có' : 'Không') : 'Không có dữ liệu'
      };
      
      // Định dạng cấu hình NTP
      const formattedNtp = {
        enabled: ntp[0] ? (ntp[0].enabled === 'true' ? 'Đã kích hoạt' : 'Vô hiệu hóa') : 'Không có dữ liệu',
        servers: ntp[0] ? ntp[0].servers : 'Không có dữ liệu',
        mode: ntp[0] ? ntp[0].mode : 'Không có dữ liệu'
      };
      
      const logsAndUsersInfo = {
        systemLogs: formattedSystemLogs,
        users: formattedUsers,
        services: {
          snmp: formattedSnmp,
          dns: formattedDns,
          ntp: formattedNtp
        }
      };
      
      connection.close();
      res.json(logsAndUsersInfo);
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        message: 'Không thể kết nối đến router'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get network info (interfaces, IP addresses, ARP, routing)
app.get('/api/routers/:id/network', async (req, res) => {
  try {
    const routerId = parseInt(req.params.id);
    const router = routerList.find(r => r.id === routerId);
    
    if (!router) {
      return res.status(404).json({ error: 'Router không tồn tại' });
    }
    
    try {
      const connection = new RouterOSAPI({
        host: router.ip,
        user: router.username,
        password: router.password,
        timeout: 5000
      });
      
      await connection.connect();
      
      // Lấy danh sách interface
      const interfaces = await connection.write('/interface/print');
      
      // Lấy danh sách địa chỉ IP
      const ipAddresses = await connection.write('/ip/address/print');
      
      // Lấy bảng ARP
      const arpTable = await connection.write('/ip/arp/print');
      
      // Lấy bảng định tuyến
      const routingTable = await connection.write('/ip/route/print');
      
      // Định dạng kết quả interfaces
      const formattedInterfaces = interfaces.map(iface => ({
        name: iface.name,
        type: iface.type || 'unknown',
        mtu: iface.mtu,
        macAddress: iface['mac-address'] || 'N/A',
        running: iface.running === 'true' ? 'Hoạt động' : 'Không hoạt động',
        disabled: iface.disabled === 'true' ? 'Vô hiệu hóa' : 'Đã kích hoạt',
        rxByte: formatBytes(parseInt(iface['rx-byte'] || 0)),
        txByte: formatBytes(parseInt(iface['tx-byte'] || 0)),
        rxPacket: iface['rx-packet'] || 0,
        txPacket: iface['tx-packet'] || 0,
        rxError: iface['rx-error'] || 0,
        txError: iface['tx-error'] || 0,
        rxDrop: iface['rx-drop'] || 0,
        txDrop: iface['tx-drop'] || 0
      }));
      
      // Định dạng danh sách IP
      const formattedIpAddresses = ipAddresses.map(ip => ({
        address: ip.address,
        network: ip.network,
        interface: ip.interface,
        disabled: ip.disabled === 'true' ? 'Vô hiệu hóa' : 'Đã kích hoạt',
        dynamic: ip.dynamic === 'true' ? 'Động' : 'Tĩnh',
        actual: ip['actual-interface'] || ip.interface
      }));
      
      // Định dạng bảng ARP
      const formattedArpTable = arpTable.map(arp => ({
        address: arp.address,
        macAddress: arp['mac-address'],
        interface: arp.interface,
        dynamic: arp.dynamic === 'true' ? 'Động' : 'Tĩnh',
        complete: arp.complete === 'true' ? 'Hoàn tất' : 'Chưa hoàn tất',
        invalid: arp.invalid === 'true' ? 'Không hợp lệ' : 'Hợp lệ'
      }));
      
      // Định dạng bảng định tuyến
      const formattedRoutingTable = routingTable.map(route => ({
        dst: route['dst-address'],
        gateway: route.gateway,
        distance: route.distance,
        interface: route.interface,
        static: route['static'] === 'true' ? 'Tĩnh' : 'Động',
        dynamic: route.dynamic === 'true' ? 'Động' : 'Tĩnh',
        active: route.active === 'true' ? 'Đang hoạt động' : 'Không hoạt động'
      }));
      
      const networkInfo = {
        interfaces: formattedInterfaces,
        ipAddresses: formattedIpAddresses,
        arpTable: formattedArpTable,
        routingTable: formattedRoutingTable
      };
      
      connection.close();
      res.json(networkInfo);
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        message: 'Không thể kết nối đến router'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all interfaces for all routers
app.get('/api/interfaces', async (req, res) => {
  try {
    const allInterfaces = [];
    
    for (const router of routerList) {
      try {
        const connection = new RouterOSAPI({
          host: router.ip,
          user: router.username,
          password: router.password,
          timeout: 5000
        });
        
        await connection.connect();
        
        // Get list of interfaces with their traffic counters
        const interfaces = await connection.write('/interface/print');
        
        // Debug: log first interface to see structure
        if (interfaces.length > 0) {
          console.log(`Sample interface data from router ${router.name}:`, 
            JSON.stringify(interfaces[0], null, 2));
        }
        
        // Get traffic data for each interface
        for (const iface of interfaces) {
          // Skip disabled interfaces
          if (iface.disabled === 'true') continue;
          
          // Get monitor traffic data for current rates
          const monitorCommand = [
            '=interface=' + iface.name,
            '=once='
          ];
          
          const trafficData = await connection.write('/interface/monitor-traffic', monitorCommand);
          
          // Add interface to the list with both total counters and current rates
          allInterfaces.push({
            id: `${router.id}-${iface.name}`,
            routerId: router.id,
            name: iface.name,
            type: iface.type || 'unknown',
            // Use traffic counters from /interface/print for totals
            rxBytes: formatBytes(parseInt(iface['rx-byte'] || 0)),
            txBytes: formatBytes(parseInt(iface['tx-byte'] || 0)),
            // Use monitor-traffic for current rates
            rxRate: formatBits(trafficData[0]?.['rx-bits-per-second'] || 0),
            txRate: formatBits(trafficData[0]?.['tx-bits-per-second'] || 0),
            status: iface.running === 'true' ? 'up' : 'down'
          });
        }
        
        connection.close();
      } catch (error) {
        console.error(`Error fetching interfaces for router ${router.name}:`, error.message);
        // Continue with next router
      }
    }
    
    res.json(allInterfaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions to format data
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatBits(bits) {
  if (bits === 0) return '0 bps';
  
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const i = Math.floor(Math.log(bits) / Math.log(1000));
  
  return parseFloat((bits / Math.pow(1000, i)).toFixed(2)) + ' ' + sizes[i];
}

// Trang HTML đơn giản để kiểm tra kết nối
const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mikrotik Dashboard - Kiểm tra kết nối</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #2c3e50;
    }
    .status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 4px;
    }
    .success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .loading {
      background-color: #e9ecef;
      color: #495057;
      border: 1px solid #ced4da;
    }
    pre {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Mikrotik Dashboard - Kiểm tra kết nối</h1>
    
    <div id="backendStatus" class="status loading">
      <h2>Kiểm tra kết nối Backend</h2>
      <p>Đang kiểm tra kết nối đến backend server...</p>
    </div>

    <div id="routerData" style="display: none;">
      <h2>Dữ liệu Router</h2>
      <pre id="routerDataContent">Đang tải...</pre>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const backendStatus = document.getElementById('backendStatus');
      const routerData = document.getElementById('routerData');
      const routerDataContent = document.getElementById('routerDataContent');
      
      // URL của API
      const apiUrl = window.location.origin + '/api/routers';
      console.log('Đang kết nối đến API:', apiUrl);

      // Kiểm tra kết nối đến backend API
      fetch(apiUrl)
        .then(response => {
          if (response.ok) {
            return response.json().then(data => {
              backendStatus.className = 'status success';
              backendStatus.innerHTML = \`
                <h2>Kết nối Backend thành công!</h2>
                <p>Backend API đang hoạt động bình thường.</p>
              \`;
              
              // Hiển thị dữ liệu router
              routerData.style.display = 'block';
              routerDataContent.textContent = JSON.stringify(data, null, 2);
            });
          } else {
            throw new Error(\`Phản hồi không thành công: \${response.status}\`);
          }
        })
        .catch(error => {
          backendStatus.className = 'status error';
          backendStatus.innerHTML = \`
            <h2>Lỗi kết nối Backend</h2>
            <p>Không thể kết nối đến API: \${error.message}</p>
            <p>Vui lòng kiểm tra:</p>
            <ul>
              <li>Backend server đã khởi động chưa?</li>
              <li>Cổng 5000 đã được mở chưa?</li>
              <li>URL API: \${apiUrl}</li>
            </ul>
          \`;
        });
    });
  </script>
</body>
</html>`;

// Phục vụ tệp tĩnh từ thư mục public
app.use(express.static(__dirname + '/public'));

// Thêm route tình trạng - giúp công cụ Replit kiểm tra máy chủ
app.get('/status', (req, res) => {
  const status = {
    status: 'ok',
    message: 'Server is running',
    port: PORT,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    routes: [
      { path: '/', description: 'Trang chủ' },
      { path: '/dashboard.html', description: 'Dashboard' },
      { path: '/router-detail.html', description: 'Chi tiết router' },
      { path: '/help.html', description: 'Trang trợ giúp' },
      { path: '/config.html', description: 'Trang cấu hình' },
      { path: '/api-docs.html', description: 'Tài liệu API' },
      { path: '/api', description: 'Tài liệu API' },
      { path: '/api/routers', description: 'Danh sách router' },
      { path: '/api/routers/status', description: 'Trạng thái router' },
      { path: '/api/routers/:id/system', description: 'Thông tin hệ thống router' },
      { path: '/api/routers/:id/network', description: 'Thông tin mạng router' },
      { path: '/api/routers/:id/services', description: 'Thông tin dịch vụ router' },
      { path: '/api/routers/:id/logs', description: 'Nhật ký và thông tin người dùng' },
      { path: '/api/interfaces', description: 'Danh sách interface' },
      { path: '/status', description: 'Kiểm tra trạng thái server' }
    ]
  };
  
  res.set('Cache-Control', 'no-store');
  res.json(status);
});

// Thêm route đặc biệt để Replit có thể xác minh rằng máy chủ web đang chạy
app.get('/replit-alive-check', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send('<html><body><h1>Server is alive</h1><p>The Mikrotik Dashboard server is running correctly.</p></body></html>');
});

// Phục vụ trang chủ từ public/index.html
// app.get('/', (req, res) => {
//   res.type('html').send(htmlContent);
// });

// Route cho API docs - Chuyển hướng đến trang tài liệu API mới
app.get('/api', (req, res) => {
  res.redirect('/api-docs.html');
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Truy cập: http://0.0.0.0:${PORT}/`);
  console.log(`Hoặc: http://localhost:${PORT}/`);
  
  // Hiển thị tất cả địa chỉ mà máy chủ đang lắng nghe
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Bỏ qua địa chỉ non-IPv4 và loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Hoặc: http://${iface.address}:${PORT}/`);
      }
    }
  }
});
