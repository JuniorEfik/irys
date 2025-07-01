// backend/services/irys.service.js
const { Uploader } = require("@irys/upload");
const { BaseEth } = require("@irys/upload-ethereum");
const fs = require('fs');

class IrysService {
  constructor() {
    this.uploader = null;
  }

  async getUploader() {
    if (!this.uploader) {
      try {
        if (!process.env.PRIVATE_KEY) {
          throw new Error('PRIVATE_KEY environment variable is required');
        }

        this.uploader = await Uploader(BaseEth).withWallet(process.env.PRIVATE_KEY);
        console.log('Connected to Irys network');
      } catch (error) {
        console.error('Failed to connect to Irys:', error);
        throw error;
      }
    }
    return this.uploader;
  }

  async checkBalance() {
    try {
      const uploader = await this.getUploader();
      const balance = await uploader.getLoadedBalance();
      console.log(`Current balance: ${uploader.utils.fromAtomic(balance)} ${uploader.token}`);
      return balance;
    } catch (error) {
      console.error('Error checking balance:', error);
      throw error;
    }
  }

  async fundAccount(amount = 0.001) {
    try {
      const uploader = await this.getUploader();
      const fundTx = await uploader.fund(uploader.utils.toAtomic(amount));
      console.log(`Successfully funded ${uploader.utils.fromAtomic(fundTx.quantity)} ${uploader.token}`);
      return fundTx;
    } catch (error) {
      console.error('Error funding account:', error);
      throw error;
    }
  }

  async uploadFile(filePath, metadata = {}) {
    try {
      const uploader = await this.getUploader();
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Prepare tags for metadata
      const tags = [];
      if (metadata.filename) {
        tags.push({ name: "filename", value: metadata.filename });
      }
      if (metadata.contentType) {
        tags.push({ name: "Content-Type", value: metadata.contentType });
      }
      
      // Add application identifier
      tags.push({ name: "application-id", value: "irys-file-share" });
      tags.push({ name: "upload-timestamp", value: new Date().toISOString() });

      console.log(`Uploading file: ${filePath}`);
      console.log(`Tags:, tags`);

      // Check balance before upload
      const balance = await this.checkBalance();
      if (balance <= 0) {
        console.log('Low balance, attempting to fund account...');
        await this.fundAccount();
      }

      // Upload file
      const receipt = await uploader.uploadFile(filePath, { tags });
      
      console.log(`File uploaded successfully!`);
      console.log(`Transaction ID: ${receipt.id}`);
      console.log(`Gateway URL: https://gateway.irys.xyz/${receipt.id}`);

      return {
        id: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`,
        tags: tags,
        timestamp: receipt.timestamp
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async uploadData(data, metadata = {}) {
    try {
      const uploader = await this.getUploader();
      
      // Prepare tags
      const tags = [];
      if (metadata.contentType) {
        tags.push({ name: "Content-Type", value: metadata.contentType });
      }
      tags.push({ name: "application-id", value: "irys-file-share" });
      tags.push({ name: "upload-timestamp", value: new Date().toISOString() });

      // Check balance
      const balance = await this.checkBalance();
      if (balance <= 0) {
        await this.fundAccount();
      }

      // Upload data
      const receipt = await uploader.upload(data, { tags });
      
      console.log(`Data uploaded successfully!`);
      console.log(`Transaction ID: ${receipt.id}`);
      console.log(`Gateway URL: https://gateway.irys.xyz/${receipt.id}`);

      return {
        id: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`,
        tags: tags,
        timestamp: receipt.timestamp
      };

    } catch (error) {
      console.error('Error uploading data:', error);
      throw error;
    }
  }

  async getUploadPrice(dataSize) {
    try {
      const uploader = await this.getUploader();
      const price = await uploader.getPrice(dataSize);
      return {
        atomic: price,
        formatted: uploader.utils.fromAtomic(price),
        token: uploader.token
      };
    } catch (error) {
      console.error('Error getting price:', error);
      throw error;
    }
  }
}

module.exports = IrysService;