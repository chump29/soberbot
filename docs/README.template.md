# ![SoberBot](./utils/images/soberbot.webp) SoberBot

> - SoberBot for Discord

---

![Bun](https://img.shields.io/badge/Bun-$_bun-informational?style=plastic&logo=bun "Bun") &nbsp;
![discord.js](https://img.shields.io/badge/discord.js-$_discord-informational?style=plastic&logo=discord.js "discord.js") &nbsp; <!-- markdownlint-disable MD013 -->
![Drizzle](https://img.shields.io/badge/Drizzle-$_drizzle-informational?style=plastic&logo=drizzle "Drizzle") &nbsp;
![SQLite](https://img.shields.io/badge/SQLite-$_sqlite-informational?style=plastic&logo=sqlite "SQLite")

![CodeQL](https://github.com/$_user/$_repo/workflows/CodeQL/badge.svg "CodeQL") &nbsp;
![Coverage](https://img.shields.io/badge/Coverage-$_coverage%25-success?style=plastic&logo=jest "Coverage")

![NO AI](https://img.shields.io/badge/NO-AI-orange?style=plastic "NO AI") &nbsp;
![License](https://img.shields.io/github/license/$_user/$_repo?style=plastic&color=blueviolet&label=License&logo=gplv3 "GPLv3") &nbsp; <!-- markdownlint-disable MD013 -->
![CVE Scan](https://img.shields.io/badge/CVE%20Scan-Pass-success?style=plastic&logo=owasp "CVE Scan")

---

### What it does: <!-- markdownlint-disable-line MD001 -->

- Tracks sobriety dates

---

### 🔗 Invite Link

[Add SoberBot](https://discord.com/oauth2/authorize?client_id=1523517133835866162&permissions=16384&integration_type=0&scope=bot)

---

### 🖥️ Discord

#### Role Permissions:

| ⚙️ Permissions |
|:--------------:|
|   EmbedLinks   |

#### Commands:

|    📋 Task     |        🔧 Command        | ⚙️ Member Permission |
|:--------------:|:------------------------:|:--------------------:|
| List All Dates |          `/all`          |    Administrator     |
|  Delete Date   |  `/delete <name\|all>`   |         None         |
|      Info      |         `/info`          |         None         |
|   List Dates   |         `/list`          |         None         |
|      Ping      |         `/ping`          |         None         |
|   Reset Date   |     `/reset <name>`      |         None         |
|    Set Date    | `/set YYYY-MM-DD <name>` |         None         |
|  Show Streak   |  `/streak <name\|all>`   |         None         |

---

### 🖧 Docker

#### Environment Variables:

| 📝 Description | 📌 Variable |  {...} Value   |
|:--------------:|:-----------:|:--------------:|
|  Embed Color   |    COLOR    |    #78866b     |
|    DB Name     |   DB_NAME   |  soberbot.db   |
|    DB Path     |   DB_PATH   |      ./db      |
|     Debug      |    DEBUG    | true/**false** |
|    Bot Name    |    NAME     |    SoberBot    |
|   Bot Token    |    TOKEN    |    \<token>    |

##### From `@postfmly/logoserver`:

| 📝 Description | 📌 Variable |    {...} Value    |
|:--------------:|:-----------:|:-----------------:|
|   Logo Name    |  LOGO_NAME  |   soberbot.webp   |
|   Local Path   |  LOGO_PATH  |  ./utils/images   |
|      Port      |  LOGO_PORT  | **Random**/[port] |
|    Logo URL    |  LOGO_URL   |      \<url>       |

##### From `@postfmly/checkrate`:

###### *NOTE: Rate limited to 1 request per 1 second*

#### Deployment:

|  📜 Script  |  🔧 Command   |
|:-----------:|:-------------:|
|    Full     | `./build.sh`  |
| Docker Only | `./docker.sh` |

---

### 📄 Documentation

### Generate:

```bash
./docs.sh
```

---

### 🛰️ Git & CI/CD

- **Pre-Commit:** Staged files are automatically linted
- **Github Actions:** Builds and pushes images to repository
  - latest
    - amd64
    - arm64
