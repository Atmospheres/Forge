package com.forge.repository;

import com.forge.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
    List<Workspace> findByOwnerSub(String ownerSub);
}