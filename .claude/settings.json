{
  "permissions": {
    "allow": [
      "Bash(GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --branch v25.2.0 https://github.com/NREL/energyplus /home/user/nrel/energyplus)",
      "Bash(cmake -S /home/user/nrel/energyplus -B /home/user/nrel/eplus-build -G Ninja -DCMAKE_BUILD_TYPE=Release -DENABLE_INSTALL_REMOTE=OFF -DBUILD_TESTING=OFF -DLINK_WITH_PYTHON=OFF -DBUILD_FORTRAN=OFF)",
      "Bash(ninja -C /home/user/nrel/eplus-build -j4 energyplus)",
      "Bash(/home/user/nrel/eplus-build/Products/energyplus --version)",
      "Bash(python3 engine/batch.py:*)",
      "Bash(python3 engine/validate.py:*)",
      "Bash(python3 engine/fit_surrogate.py:*)",
      "Bash(python3 engine/run_scenario.py:*)"
    ]
  }
}
