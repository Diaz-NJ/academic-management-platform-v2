package com.ptc.amp.repository;

import com.ptc.amp.model.GroupInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Long> {
    List<GroupInvitation> findByInvitedUserIdAndStatus(Long invitedUserId, String status);
    List<GroupInvitation> findByInvitedBy(Long invitedBy);
    boolean existsByGroupIdAndInvitedUserIdAndStatus(Long groupId, Long invitedUserId, String status);
}