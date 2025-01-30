import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  user: any = {
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    document: [],
    checkIn: '',
    checkOut: ''
  };
  users: any[] = [];
  searchQuery: string = '';
  selectedFiles: File[] = [];
  isEditMode: boolean = false;
  message: { text: string, type: string } | null = null;
  removedFiles: any[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  showMessage(text: string, type: string): void {
    this.message = { text, type };
    setTimeout(() => {
      this.message = null;
    }, 3000);
  }

  onFilesSelect(event: any): void {
    const input = event.target as HTMLInputElement;

    if (input.files) {
      // Convert FileList to an array
      const newFiles = Array.from(input.files) as File[];

      // Merge new files with selectedFiles, avoiding duplicates
      newFiles.forEach((newFile) => {
        const isDuplicate = this.selectedFiles.some(
          (existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size
        );

        if (!isDuplicate) {
          this.selectedFiles.push(newFile);
        }
      });
    }

    // Reset the file input value
    input.value = '';
  }




  onSubmit(form: any): void {
    const formData = new FormData();
    formData.append('name', this.user.name);
    formData.append('email', this.user.email);
    formData.append('phone', this.user.phone);
    formData.append('address', this.user.address);
    formData.append('checkIn', this.user.checkIn); // Add Check-In
    formData.append('checkOut', this.user.checkOut); // Add Check-Out

    // Append newly selected files
    this.selectedFiles.forEach((file) => {
      formData.append('documents', file);
    });

    // Append removed files
    formData.append('removedFiles', JSON.stringify(this.removedFiles));

    if (this.isEditMode) {
      this.http.put(`http://localhost:3000/customers/${this.user.id}`, formData).subscribe(
        () => {
          this.showMessage('User updated successfully!', 'success');
          this.loadUsers();
          form.resetForm();
          this.resetForm();
        },
        () => this.showMessage('Failed to update user. Please try again.', 'error')
      );
    } else {
      this.http.post('http://localhost:3000/customers', formData).subscribe(
        () => {
          this.showMessage('User added successfully!', 'success');
          this.loadUsers();
          form.resetForm();
          this.resetForm();
        },
        () => this.showMessage('Failed to add user. Please try again.', 'error')
      );
    }
  }




  loadUsers(): void {
    this.http.get<any[]>('http://localhost:3000/customers').subscribe((data) => {
      this.users = data.map((user) => ({
        ...user,
        id: user._id,
        document: user.documents || [],
      }));
    });
  }

  editUser(user: any): void {
    this.user = { ...user };
    this.isEditMode = true;
    this.scrollToTop();
  }
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  resetForm(): void {
    this.user = { id: null, name: '', email: '', phone: '', address: '', document: [] };
    this.isEditMode = false;
    this.selectedFiles = [];
  }

  deleteUser(user:any){
    this.user = { ...user };
    if (confirm("Are you sure you want to delete?")) {
      this.http.delete(`http://localhost:3000/customers/${this.user.id}`).subscribe(()=>{
        this.showMessage('User deleted successfully!', 'success');
        this.loadUsers();

      })
      console.log("Customer deleted");
    }
  }

  // removeFile(file: any): void {
  //   this.user.document = this.user.document.filter((f: any) => f !== file);
  // }

  removeFile(file: any): void {
    // Remove the file from the UI only
    if (!this.removedFiles.includes(file)) {
      console.log(" files", file)
      this.user.document = this.user.document.filter((f: any) => f.fileId !== file.fileId);

      // Store removed file IDs for later deletion
      this.removedFiles.push(file.fileId);
    }
    console.log("removed files", this.removedFiles)
  }

  filteredUsers(): any[] {
    if (!this.searchQuery) {
      return this.users.slice().reverse(); // Reverse the user list
    }
    const query = this.searchQuery.toLowerCase();
    return this.users
      .filter((user) => user.name.toLowerCase().includes(query))
      .slice()
      .reverse(); // Reverse the filtered list
  }
}

